<?php

namespace App\Console\Commands;

use App\Services\FirebaseNotificationService;
use Illuminate\Console\Command;

class RemindUnprocessedOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:remind-unprocessed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send FCM and database reminders to admins for paid orders not shipped after 24 hours';

    /**
     * Execute the console command.
     */
    public function handle(FirebaseNotificationService $fcm): int
    {
        $this->info('Checking for paid orders stuck in processing for more than 24 hours...');

        $sent = $fcm->notifyUnprocessedPaidOrders();

        if ($sent > 0) {
            $this->info("Sent {$sent} reminder notification(s) to admins.");
        } else {
            $this->info('No unprocessed orders requiring reminders at this time.');
        }

        return Command::SUCCESS;
    }
}
