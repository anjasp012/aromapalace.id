<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PakasirService
{
    /**
     * List of direct payment methods officially supported by Pakasir v2.
     *
     * @var array<int, string>
     */
    public const DIRECT_METHODS = [
        'qris',
        'bri_va',
        'bni_va',
        'cimb_niaga_va',
        'danamon_va',
        'maybank_va',
        'bnc_va',
        'bsi_va',
        'muamalat_va',
        'ocbc_va',
        'payment_link',
    ];

    public function __construct(
        protected ?string $slug = null,
        protected ?string $apiKey = null,
        protected ?string $webhookSecret = null,
        protected ?string $baseUrl = null,
    ) {
        $this->slug = $slug ?: (string) config('services.pakasir.slug', 'aromapalace-id');
        $this->apiKey = $apiKey ?: (string) config('services.pakasir.api_key', '');
        $this->webhookSecret = $webhookSecret ?: (string) config('services.pakasir.webhook_secret', '');
        $this->baseUrl = rtrim($baseUrl ?: (string) config('services.pakasir.base_url', 'https://app.pakasir.com'), '/');
    }

    /**
     * Map payment method string to valid Pakasir method.
     */
    public function mapMethod(string $method): string
    {
        $normalized = strtolower(trim($method));

        if (in_array($normalized, self::DIRECT_METHODS, true)) {
            return $normalized;
        }

        // Map common aliases or unsupported direct VAs to payment_link or qris
        return match ($normalized) {
            'qris_instant', 'qris_payment' => 'qris',
            'bri', 'bank_bri' => 'bri_va',
            'bni', 'bank_bni' => 'bni_va',
            'bsi', 'bank_bsi' => 'bsi_va',
            'cimb', 'cimb_niaga' => 'cimb_niaga_va',
            'danamon' => 'danamon_va',
            default => 'payment_link',
        };
    }

    /**
     * Create a transaction in Pakasir v2.
     *
     * Endpoint: POST /api/v2/create-transaction/{slug}/{order_id}
     *
     * @return array{success: bool, data?: array<string, mixed>, error?: string}
     */
    public function createTransaction(string $orderNumber, int $amount, string $method): array
    {
        $pakasirMethod = $this->mapMethod($method);
        $endpoint = "{$this->baseUrl}/api/v2/create-transaction/{$this->slug}/{$orderNumber}";

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15)->post($endpoint, [
                'method' => $pakasirMethod,
                'amount' => max(1, $amount),
            ]);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'data' => is_array($data) ? $data : [],
                ];
            }

            Log::error('Pakasir createTransaction failed: HTTP '.$response->status(), [
                'endpoint' => $endpoint,
                'order' => $orderNumber,
                'method' => $pakasirMethod,
                'response' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => $response->json('message') ?: 'Gagal membuat transaksi di Pakasir (HTTP '.$response->status().')',
            ];
        } catch (Exception $e) {
            Log::error('Pakasir createTransaction exception: '.$e->getMessage(), [
                'order' => $orderNumber,
                'method' => $pakasirMethod,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check transaction status from Pakasir v2.
     *
     * Endpoint: GET /api/v2/transaction-status/{slug}/{txn_id}
     *
     * @return array{success: bool, data?: array<string, mixed>, error?: string}
     */
    public function checkTransactionStatus(string $txnId): array
    {
        $endpoint = "{$this->baseUrl}/api/v2/transaction-status/{$this->slug}/{$txnId}";

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->apiKey,
                'Accept' => 'application/json',
            ])->timeout(10)->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'data' => is_array($data) ? $data : [],
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('message') ?: 'Gagal mengambil status transaksi dari Pakasir',
            ];
        } catch (Exception $e) {
            Log::error('Pakasir checkTransactionStatus exception: '.$e->getMessage(), [
                'txn_id' => $txnId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel an existing transaction in Pakasir v2.
     *
     * Endpoint: POST /api/v2/cancel-transaction/{slug}/{txn_id}
     *
     * @return array{success: bool, message?: string, error?: string}
     */
    public function cancelTransaction(string $txnId): array
    {
        $endpoint = "{$this->baseUrl}/api/v2/cancel-transaction/{$this->slug}/{$txnId}";

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->apiKey,
                'Accept' => 'application/json',
            ])->timeout(10)->post($endpoint);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => (string) ($response->json('message') ?: 'Berhasil membatalkan transaksi'),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('message') ?: 'Gagal membatalkan transaksi di Pakasir',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify incoming webhook secret against configured secret.
     */
    public function verifyWebhookSecret(?string $secret): bool
    {
        if (empty($secret) || empty($this->webhookSecret)) {
            return false;
        }

        return hash_equals($this->webhookSecret, trim($secret));
    }
}
