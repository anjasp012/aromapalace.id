<?php

namespace App\Console\Commands;

use App\Services\OrderService;
use Illuminate\Console\Command;

class AutoCompleteOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:auto-complete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically mark delivered orders as completed after the 3-day grace period has passed';

    /**
     * Execute the console command.
     */
    public function handle(OrderService $orderService): int
    {
        $this->info('Checking for delivered orders exceeding the 3-day grace period...');

        $completedCount = $orderService->autoCompleteDeliveredOrders();

        $this->info("Successfully auto-completed {$completedCount} delivered orders.");

        return Command::SUCCESS;
    }
}
