<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPointHistory;
use App\Models\Membership;
use App\Models\User;
use App\Services\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService
    ) {}

    /**
     * Display a paginated listing of users with search & role filters.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = (string) $request->query('role', 'all');

        $query = User::withCount(['orders'])
            ->with(['membership'])
            ->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role !== 'all') {
            $query->where('role', $role);
        }

        $users = $query->paginate(20)->withQueryString();

        $metrics = [
            'total_users' => User::count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_members' => Membership::count(),
        ];

        return Inertia::render('admin/users/index', [
            'users' => $users->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'orders_count' => $user->orders_count,
                'membership' => $user->membership ? [
                    'points' => $user->membership->points,
                    'points_formatted' => number_format($user->membership->points, 0, ',', '.'),
                    'membership_number' => $user->membership->membership_number,
                ] : null,
                'created_at' => $user->created_at?->format('d M Y'),
                'created_at_human' => $user->created_at?->diffForHumans(),
            ]),
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'metrics' => $metrics,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'in:admin,customer'],
            'password' => ['required', 'string', 'min:8'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
        ]);

        $avatarUrl = null;
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $avatarUrl = Storage::url($path);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'avatar' => $avatarUrl,
        ]);

        if ($user->role === 'customer') {
            $this->membershipService->getMembership($user, autoCreate: true);
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Pengguna {$user->name} berhasil ditambahkan.");
    }

    /**
     * Show the form for editing an existing user.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'address' => $user->primaryAddress?->address,
                'city' => $user->primaryAddress?->city_name,
                'postal_code' => $user->primaryAddress?->postal_code,
            ],
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'in:admin,customer'],
            'password' => ['nullable', 'string', 'min:8'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'remove_avatar' => ['nullable', 'boolean'],
        ]);

        // Prevent self role demotion
        if ($user->id === $request->user()->id && $validated['role'] !== 'admin') {
            return back()->with('error', 'Anda tidak dapat mengubah role akun Anda sendiri menjadi bukan admin.');
        }

        if ($request->boolean('remove_avatar')) {
            if (! empty($user->avatar) && str_contains($user->avatar, '/storage/avatars/')) {
                $storagePath = str_replace('/storage/', '', $user->avatar);
                Storage::disk('public')->delete($storagePath);
            }
            $user->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            if (! empty($user->avatar) && str_contains($user->avatar, '/storage/avatars/')) {
                $storagePath = str_replace('/storage/', '', $user->avatar);
                Storage::disk('public')->delete($storagePath);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = Storage::url($path);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if ($user->role === 'customer' && ! $user->membership) {
            $this->membershipService->getMembership($user, autoCreate: true);
        }

        return redirect()->route('admin.users.index')
            ->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    /**
     * Show details of a specific user (orders + point history).
     */
    public function show(User $user): Response
    {
        $user->load('membership');

        $membership = $user->membership;

        $totalPointsIn = $membership ? (int) $membership->pointHistories()->where('points', '>', 0)->sum('points') : 0;
        $totalPointsOut = $membership ? (int) abs($membership->pointHistories()->where('points', '<', 0)->sum('points')) : 0;

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at?->format('d M Y, H:i').' WIB',
                'orders_count' => $user->orders()->count(),
            ],
            'membership' => $membership ? [
                'id' => $membership->id,
                'membership_number' => $membership->membership_number,
                'points' => $membership->points,
                'points_formatted' => number_format($membership->points, 0, ',', '.'),
                'lifetime_points' => $membership->lifetime_points,
                'lifetime_points_formatted' => number_format($membership->lifetime_points, 0, ',', '.'),
                'joined_at' => $membership->joined_at?->format('d M Y'),
                'total_points_in' => $totalPointsIn,
                'total_points_in_formatted' => number_format($totalPointsIn, 0, ',', '.'),
                'total_points_out' => $totalPointsOut,
                'total_points_out_formatted' => number_format($totalPointsOut, 0, ',', '.'),
            ] : null,
            'point_histories' => $membership
                ? $membership->pointHistories()
                    ->latest()
                    ->take(30)
                    ->get()
                    ->map(fn (LoyaltyPointHistory $h) => [
                        'id' => $h->id,
                        'type' => $h->type,
                        'category' => $h->points >= 0 ? 'masuk' : 'berkurang',
                        'type_label' => $h->points >= 0 ? 'Poin Masuk' : 'Poin Berkurang',
                        'points' => $h->points,
                        'points_formatted' => ($h->points > 0 ? '+' : '').number_format($h->points, 0, ',', '.'),
                        'balance_after' => $h->balance_after,
                        'balance_after_formatted' => number_format($h->balance_after, 0, ',', '.'),
                        'description' => $h->description,
                        'reference_id' => $h->reference_id,
                        'created_at' => $h->created_at?->format('d M Y, H:i').' WIB',
                        'is_positive' => $h->points > 0,
                    ])
                    ->all()
                : [],
            'recent_orders' => $user->orders()
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'order_number' => $o->order_number,
                    'total_amount_formatted' => 'Rp '.number_format($o->total_amount, 0, ',', '.'),
                    'status' => $o->status ?? 'menunggu_pembayaran',
                    'payment_status' => $o->payment_status,
                    'created_at' => $o->created_at?->format('d M Y'),
                ])
                ->all(),
        ]);
    }

    /**
     * Change user role (admin <-> customer).
     */
    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'role' => ['required', 'in:admin,customer'],
        ]);

        // Prevent changing own role
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat mengubah role akun Anda sendiri.');
        }

        $user->update(['role' => $request->role]);

        return back()->with('success', "Role {$user->name} berhasil diubah menjadi ".ucfirst($request->role).'.');
    }

    /**
     * Manually add loyalty points (Poin Masuk) to a user.
     */
    public function addPoints(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'points' => ['required', 'integer', 'min:1', 'max:10000'],
            'description' => ['required', 'string', 'max:255'],
        ]);

        if ($user->isAdmin()) {
            return back()->with('error', 'Tidak dapat menambahkan poin ke akun admin.');
        }

        $this->membershipService->addPoints(
            user: $user,
            points: (int) $request->points,
            description: $request->description.' (Admin: '.$request->user()->name.')',
            type: 'bonus'
        );

        return back()->with('success', "+{$request->points} Poin berhasil ditambahkan ke akun {$user->name}.");
    }

    /**
     * Manually deduct loyalty points (Poin Berkurang) from a user.
     */
    public function deductPoints(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'points' => ['required', 'integer', 'min:1', 'max:10000'],
            'description' => ['required', 'string', 'max:255'],
        ]);

        if ($user->isAdmin()) {
            return back()->with('error', 'Tidak dapat mengurangi poin dari akun admin.');
        }

        $result = $this->membershipService->deductPoints(
            user: $user,
            points: (int) $request->points,
            description: $request->description.' (Admin: '.$request->user()->name.')',
            type: 'berkurang'
        );

        if (! $result) {
            return back()->with('error', "Poin tidak mencukupi. Saldo poin {$user->name} tidak cukup untuk dikurangi.");
        }

        return back()->with('success', "-{$request->points} Poin berhasil dikurangi dari akun {$user->name}.");
    }

    /**
     * Delete a customer user account.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        if ($user->role === 'admin') {
            return back()->with('error', 'Akun admin tidak dapat dihapus melalui panel ini.');
        }

        $hasActiveOrders = $user->orders()
            ->where(function ($q) {
                $q->whereIn('status', ['menunggu_pembayaran', 'diproses', 'dikirim'])
                    ->orWhere(fn ($sub) => $sub->whereNull('status')->whereIn('payment_status', ['pending', 'paid']));
            })
            ->exists();

        if ($hasActiveOrders) {
            return back()->with('error', "Pengguna \"{$user->name}\" tidak dapat dihapus saat ini karena masih memiliki pesanan yang sedang aktif.");
        }

        $name = $user->name;

        // Clean up cart and wishlist
        $user->cartItems()->delete();
        $user->wishlists()->delete();

        // Soft delete user (past orders retain user snapshot and history)
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', "Akun {$name} berhasil dihapus.");
    }
}
