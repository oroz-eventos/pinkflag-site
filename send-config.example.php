<?php

declare(strict_types=1);

return [
    'recipient' => 'gabriel@oroz.com.br',
    'sender_email' => 'onboarding@resend.dev',
    'sender_name' => 'Pink Flag Site',
    'smtp' => [
        'host' => 'smtp.resend.com',
        'port' => 587,
        'security' => 'tls',
        'username' => 'resend',
        'password' => 'replace-with-your-smtp-password',
        'timeout' => 15,
    ],
];
