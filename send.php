<?php

declare(strict_types=1);

function wants_json(): bool
{
    $acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

    return stripos($acceptHeader, 'application/json') !== false
        || strcasecmp($requestedWith, 'XMLHttpRequest') === 0;
}

function respond(bool $ok, string $message, int $statusCode = 200): never
{
    http_response_code($statusCode);

    if (wants_json()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(
            ['ok' => $ok, 'message' => $message],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
        exit;
    }

    $query = http_build_query([
        'form_status' => $ok ? 'success' : 'error',
        'form_message' => $message,
    ]);

    header('Location: ./index.html?' . $query . '#contato', true, 303);
    exit;
}

function clean_line(string $value): string
{
    $value = trim($value);

    return preg_replace("/[\r\n]+/", ' ', $value) ?? '';
}

function clean_text(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);

    return preg_replace("/\n{3,}/", "\n\n", $value) ?? $value;
}

function read_config(): array
{
    $path = __DIR__ . '/send-config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Arquivo send-config.php nao encontrado.');
    }

    $config = require $path;
    if (!is_array($config)) {
        throw new RuntimeException('Configuracao de envio invalida.');
    }

    return $config;
}

function smtp_read_response($socket): array
{
    $buffer = '';

    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }

        $buffer .= $line;

        if (preg_match('/^(\d{3})([ -])/', $line, $matches) === 1 && $matches[2] === ' ') {
            return [
                'code' => (int) $matches[1],
                'message' => trim($buffer),
            ];
        }
    }

    throw new RuntimeException('Servidor SMTP nao respondeu corretamente.');
}

function smtp_command($socket, string $command, array $expectedCodes): array
{
    if ($command !== '') {
        fwrite($socket, $command . "\r\n");
    }

    $response = smtp_read_response($socket);
    if (!in_array($response['code'], $expectedCodes, true)) {
        throw new RuntimeException($response['message']);
    }

    return $response;
}

function smtp_connect(array $smtp)
{
    $host = (string) ($smtp['host'] ?? '');
    $port = (int) ($smtp['port'] ?? 0);
    $timeout = (int) ($smtp['timeout'] ?? 15);
    $security = strtolower((string) ($smtp['security'] ?? 'tls'));

    if ($host === '' || $port <= 0) {
        throw new RuntimeException('Host ou porta SMTP invalidos.');
    }

    $transportHost = $security === 'ssl' ? 'ssl://' . $host : $host;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'peer_name' => $host,
            'SNI_enabled' => true,
        ],
    ]);

    $socket = @stream_socket_client(
        $transportHost . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if ($socket === false) {
        throw new RuntimeException('Falha na conexao SMTP: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, $timeout);
    smtp_command($socket, '', [220]);

    return $socket;
}

function smtp_send_message(array $config, string $replyTo, string $subject, string $body): void
{
    $smtp = $config['smtp'] ?? null;
    if (!is_array($smtp)) {
        throw new RuntimeException('Configuracao SMTP ausente.');
    }

    $senderEmail = clean_line((string) ($config['sender_email'] ?? ''));
    $senderName = clean_line((string) ($config['sender_name'] ?? 'Pink Flag'));
    $recipient = clean_line((string) ($config['recipient'] ?? ''));
    $username = (string) ($smtp['username'] ?? '');
    $password = (string) ($smtp['password'] ?? '');
    $security = strtolower((string) ($smtp['security'] ?? 'tls'));

    if ($senderEmail === '' || !filter_var($senderEmail, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Sender email invalido na configuracao.');
    }

    if ($recipient === '' || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Recipient invalido na configuracao.');
    }

    if ($username === '' || $password === '') {
        throw new RuntimeException('Usuario ou senha SMTP ausentes.');
    }

    $socket = smtp_connect($smtp);
    $hostname = $_SERVER['SERVER_NAME'] ?? 'localhost';

    try {
        smtp_command($socket, 'EHLO ' . $hostname, [250]);

        if ($security === 'tls' || $security === 'starttls') {
            smtp_command($socket, 'STARTTLS', [220]);

            $cryptoEnabled = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($cryptoEnabled !== true) {
                throw new RuntimeException('Nao foi possivel iniciar TLS com o servidor SMTP.');
            }

            smtp_command($socket, 'EHLO ' . $hostname, [250]);
        }

        smtp_command($socket, 'AUTH LOGIN', [334]);
        smtp_command($socket, base64_encode($username), [334]);
        smtp_command($socket, base64_encode($password), [235]);
        smtp_command($socket, 'MAIL FROM:<' . $senderEmail . '>', [250]);
        smtp_command($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        smtp_command($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . preg_replace('/[^a-z0-9.-]+/i', '', $hostname) . '>',
            'From: ' . $senderName . ' <' . $senderEmail . '>',
            'To: ' . $recipient,
            'Reply-To: ' . $replyTo,
            'Subject: ' . $subject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        $data = implode("\r\n", $headers) . "\r\n\r\n" . $body;
        $data = str_replace(["\r\n", "\r"], "\n", $data);
        $data = preg_replace('/^\./m', '..', $data) ?? $data;
        $data = str_replace("\n", "\r\n", $data);

        fwrite($socket, $data . "\r\n.\r\n");
        smtp_command($socket, '', [250]);
        smtp_command($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(false, 'Metodo nao permitido.', 405);
}

if (!empty($_POST['website'] ?? '')) {
    respond(true, 'Mensagem enviada com sucesso.');
}

$name = clean_line((string) ($_POST['name'] ?? ''));
$company = clean_line((string) ($_POST['company'] ?? ''));
$phone = clean_line((string) ($_POST['phone'] ?? ''));
$email = clean_line((string) ($_POST['email'] ?? ''));
$message = clean_text((string) ($_POST['message'] ?? ''));

if ($name === '' || $company === '' || $phone === '' || $email === '' || $message === '') {
    respond(false, 'Preencha todos os campos obrigatorios.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Informe um email valido.', 422);
}

$subject = 'Pink Flag - novo contato do site';
$body = implode("\n", [
    'Novo contato recebido pelo site Pink Flag.',
    '',
    'Nome: ' . $name,
    'Empresa: ' . $company,
    'Telefone: ' . $phone,
    'Email: ' . $email,
    '',
    'Mensagem:',
    $message,
]);

$config = [];

try {
    $config = read_config();
    smtp_send_message($config, $email, $subject, $body);
} catch (Throwable $exception) {
    error_log(
        'Pink Flag send.php smtp failed: '
        . json_encode(
            [
                'to' => $config['recipient'] ?? null,
                'reply_to' => $email,
                'error' => $exception->getMessage(),
            ],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        )
    );

    respond(false, 'Nao foi possivel enviar sua mensagem agora. Tente novamente em alguns minutos.', 500);
}

respond(true, 'Mensagem enviada com sucesso. Vamos falar com voce em breve.');
