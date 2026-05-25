<?php

declare(strict_types=1);

const CONTACT_RECIPIENT = 'gabriel@oroz.com.br';
const CONTACT_SENDER = 'contato@pinkflag.com.br';

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
$bodyLines = [
    'Novo contato recebido pelo site Pink Flag.',
    '',
    'Nome: ' . $name,
    'Empresa: ' . $company,
    'Telefone: ' . $phone,
    'Email: ' . $email,
    '',
    'Mensagem:',
    $message,
];
$body = implode("\n", $bodyLines);

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Pink Flag Site <' . CONTACT_SENDER . '>',
    'Reply-To: ' . $email,
]);

ini_set('sendmail_from', CONTACT_SENDER);

$mailParams = '-f' . CONTACT_SENDER;
$sent = @mail(CONTACT_RECIPIENT, $subject, $body, $headers, $mailParams);

if (!$sent) {
    $lastError = error_get_last();
    error_log(
        'Pink Flag send.php mail() failed: '
        . json_encode(
            [
                'to' => CONTACT_RECIPIENT,
                'from' => CONTACT_SENDER,
                'reply_to' => $email,
                'error' => $lastError,
            ],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        )
    );
    respond(false, 'Nao foi possivel enviar sua mensagem agora. Tente novamente em alguns minutos.', 500);
}

respond(true, 'Mensagem enviada com sucesso. Vamos falar com voce em breve.');
