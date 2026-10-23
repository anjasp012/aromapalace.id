<?php

namespace App\Console\Commands;

use App\Services\OrderService;
use Illuminate\Console\Command;

class CancelExpiredOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:cancel-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel pending orders older than 24 hours, restore stock, and notify customers via FCM';

    /**
     * Execute the console command.
     */
    public function handle(OrderService $orderService): int
    {
        $this->info('Checking for expired orders older than 24 hours...');

        $canceledCount = $orderService->cancelExpiredOrders();

        $this->info("Successfully canceled {$canceledCount} expired orders.");

        return Command::SUCCESS;
    }
}
