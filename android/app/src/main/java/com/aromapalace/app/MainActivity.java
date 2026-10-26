package com.aromapalace.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.ImageView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    /** Never keep the splash longer than this, even if the page never finishes loading. */
    private static final long MAX_SPLASH_MS = 15000;

    private View splashView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showSplash();
    }

    /**
     * Full-screen splash artwork (res/drawable-nodpi/splash_art.jpg) shown over the WebView until the
     * first page has loaded. Android 12+ system splash screens can only show a small icon, so
     * the @capacitor/splash-screen plugin is excluded on Android (see capacitor.config.ts).
     */
    private void showSplash() {
        ImageView image = new ImageView(this);
        image.setImageResource(R.drawable.splash_art);
        image.setScaleType(ImageView.ScaleType.CENTER_CROP);
        image.setBackgroundResource(R.color.splashBackground);
        image.setClickable(true);
        addContentView(image, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        splashView = image;

        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    hideSplash(300);
                }

                @Override
                public void onReceivedError(WebView webView) {
                    hideSplash(0);
                }
            }
        );
        new Handler(Looper.getMainLooper()).postDelayed(() -> hideSplash(0), MAX_SPLASH_MS);
    }

    private void hideSplash(long delayMs) {
        new Handler(Looper.getMainLooper()).postDelayed(
            () -> {
                View view = splashView;
                if (view == null) return;
                splashView = null;
                view
                    .animate()
                    .alpha(0f)
                    .setDuration(400)
                    .withEndAction(() -> {
                        ViewGroup parent = (ViewGroup) view.getParent();
                        if (parent != null) parent.removeView(view);
                    });
            },
            delayMs
        );
    }
}
