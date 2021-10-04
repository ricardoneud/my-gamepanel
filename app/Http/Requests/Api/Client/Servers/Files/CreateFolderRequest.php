<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class CreateFolderRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'root' => 'sometimes|nullable|string',
            'name' => 'required|string',
        ];
    }
}
