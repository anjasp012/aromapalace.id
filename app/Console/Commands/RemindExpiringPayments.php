<?php

namespace App\Console\Commands;

use App\Services\FirebaseNotificationService;
use Illuminate\Console\Command;

class RemindExpiringPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:remind-expiring-payments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send FCM reminder to users with pending orders expiring in ~1 hour (23–24h window)';

    /**
     * Execute the console command.
     */
    public function handle(FirebaseNotificationService $fcm): int
    {
        $this->info('Checking for orders expiring in the next hour...');

        $sent = $fcm->notifyPaymentExpiringSoon();

        if ($sent > 0) {
            $this->info("Sent {$sent} payment expiry reminder(s) to customers.");
        } else {
            $this->info('No orders entering the 1-hour expiry window at this time.');
        }

        return Command::SUCCESS;
    }
}
