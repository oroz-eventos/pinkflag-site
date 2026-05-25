<?php

declare(strict_types=1);

const DEBUG_TOKEN = 'troque-este-token-agora';
const DEBUG_RECIPIENT = 'gabriel@oroz.com.br';
const DEBUG_SENDER = 'contato@pinkflag.com.br';

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function html_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$token = (string) ($_REQUEST['token'] ?? '');
if ($token !== DEBUG_TOKEN) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Defina um token em mail-debug.php e acesse com ?token=SEU_TOKEN";
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $subject = 'Pink Flag debug mail';
    $body = "Teste de envio disparado por mail-debug.php em " . date(DATE_ATOM);
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: Pink Flag Debug <' . DEBUG_SENDER . '>',
        'Reply-To: ' . DEBUG_RECIPIENT,
    ]);

    ini_set('sendmail_from', DEBUG_SENDER);

    $mailReturn = @mail(DEBUG_RECIPIENT, $subject, $body, $headers, '-f' . DEBUG_SENDER);
    $lastError = error_get_last();

    json_response([
        'ok' => $mailReturn,
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? null,
        'sendmail_path' => ini_get('sendmail_path'),
        'sendmail_from' => ini_get('sendmail_from'),
        'smtp' => ini_get('SMTP'),
        'smtp_port' => ini_get('smtp_port'),
        'mail_add_x_header' => ini_get('mail.add_x_header'),
        'disable_functions' => ini_get('disable_functions'),
        'recipient' => DEBUG_RECIPIENT,
        'sender' => DEBUG_SENDER,
        'last_error' => $lastError,
    ], $mailReturn ? 200 : 500);
}
?>
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pink Flag Mail Debug</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 720px;
        margin: 40px auto;
        padding: 0 16px;
        line-height: 1.5;
      }

      code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
      }

      button {
        padding: 12px 18px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>Pink Flag Mail Debug</h1>
    <p>Este arquivo envia um e-mail de teste e devolve um JSON com o resultado do <code>mail()</code>.</p>
    <p>Remova este arquivo do servidor assim que terminar o teste.</p>

    <form method="post" action="?token=<?= html_escape(DEBUG_TOKEN) ?>">
      <button type="submit">Executar teste de e-mail</button>
    </form>
  </body>
</html>
