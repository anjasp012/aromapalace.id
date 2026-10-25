<?php

namespace App\Events;

use App\Models\Order;
use App\Models\Shipping;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ShippingUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ?Shipping $shipping;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Order $order,
        ?Shipping $shipping = null
    ) {
        $this->shipping = $shipping ?? $order->shipping;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('orders.'.$this->order->order_number),
            new PrivateChannel('orders.'.$this->order->order_number),
            new Channel('admin.orders'),
            new PrivateChannel('admin'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ShippingUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status,
            'awb' => $this->shipping?->awb,
            'courier' => $this->shipping?->courier ?? $this->order->courier,
            'text' => $this->shipping?->text,
            'delivered_at' => $this->shipping?->delivered_at?->toIso8601String(),
            'auto_completes_at' => $this->shipping?->auto_completes_at?->toIso8601String(),
            'auto_completes_at_formatted' => $this->shipping?->auto_completes_at?->translatedFormat('d F Y, H:i'),
            'histories' => (array) ($this->shipping?->histories ?? []),
        ];
    }
}
