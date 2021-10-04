<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Database;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Services\Databases\DatabasePasswordService;
use Pterodactyl\Services\Databases\DatabaseManagementService;
use Pterodactyl\Contracts\Repository\DatabaseRepositoryInterface;
use Pterodactyl\Transformers\Api\Application\ServerDatabaseTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\GetServerDatabaseRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\GetServerDatabasesRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\ServerDatabaseWriteRequest;
use Pterodactyl\Http\Requests\Api\Application\Servers\Databases\StoreServerDatabaseRequest;

class DatabaseController extends ApplicationApiController
{
    private DatabaseManagementService $databaseManagementService;
    private DatabasePasswordService $databasePasswordService;
    private DatabaseRepositoryInterface $repository;

    /**
     * DatabaseController constructor.
     */
    public function __construct(
        DatabaseManagementService $databaseManagementService,
        DatabasePasswordService $databasePasswordService,
        DatabaseRepositoryInterface $repository
    ) {
        parent::__construct();

        $this->databaseManagementService = $databaseManagementService;
        $this->databasePasswordService = $databasePasswordService;
        $this->repository = $repository;
    }

    /**
     * Return a listing of all databases currently available to a single
     * server.
     *
     * @throws \Illuminate\Contracts\Container\BindingResolutionException
     */
    public function index(GetServerDatabasesRequest $request, Server $server): array
    {
        return $this->fractal->collection($server->databases)
            ->transformWith(ServerDatabaseTransformer::class)
            ->toArray();
    }

    /**
     * Return a single server database.
     *
     * @throws \Illuminate\Contracts\Container\BindingResolutionException
     */
    public function view(GetServerDatabaseRequest $request, Server $server, Database $database): array
    {
        return $this->fractal->item($database)
            ->transformWith(ServerDatabaseTransformer::class)
            ->toArray();
    }

    /**
     * Reset the password for a specific server database.
     *
     * @throws \Throwable
     */
    public function resetPassword(ServerDatabaseWriteRequest $request, Server $server, Database $database): Response
    {
        $this->databasePasswordService->handle($database);

        return $this->returnNoContent();
    }

    /**
     * Create a new database on the Panel for a given server.
     *
     * @throws \Throwable
     */
    public function store(StoreServerDatabaseRequest $request, Server $server): JsonResponse
    {
        $database = $this->databaseManagementService->create($server, array_merge($request->validated(), [
            'database' => $request->databaseName(),
        ]));

        return $this->fractal->item($database)
            ->transformWith(ServerDatabaseTransformer::class)
            ->respond(Response::HTTP_CREATED);
    }

    /**
     * Handle a request to delete a specific server database from the Panel.
     *
     * @throws \Exception
     */
    public function delete(ServerDatabaseWriteRequest $request, Database $database): Response
    {
        $this->databaseManagementService->delete($database);

        return $this->returnNoContent();
    }
}
