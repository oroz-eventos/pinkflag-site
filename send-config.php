<?php

declare(strict_types=1);

return [
    'recipient' => 'alexandre@pinkflag.com.br',
    'sender_email' => 'alexandre@pinkflag.com.br',
    'sender_name' => 'Pink Flag Site',
    'smtp' => [
        'host' => 'smtp.mailserverpro.com.br',
        'port' => 587,
        'security' => 'none',
        'username' => 'alexandre@pinkflag.com.br',
        'password' => 'replace-with-your-smtp-password',
        'timeout' => 15,
        'auth_methods' => ['login', 'plain'],
    ],
];
