package com.kisansetu.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.view.View;
import android.view.Gravity;
import android.widget.FrameLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int SYSTEM_BAR_GREEN = Color.rgb(220, 252, 231);
    private View statusBarBackground;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        installStatusBarBackground();
        applySystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBars();
    }

    private void installStatusBarBackground() {
        FrameLayout decorView = (FrameLayout) getWindow().getDecorView();
        statusBarBackground = new View(this);
        statusBarBackground.setBackgroundColor(SYSTEM_BAR_GREEN);
        statusBarBackground.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);

        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            0
        );
        layoutParams.gravity = Gravity.TOP;
        decorView.addView(statusBarBackground, layoutParams);

        decorView.setOnApplyWindowInsetsListener((view, insets) -> {
            int topInset;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                topInset = insets.getInsets(android.view.WindowInsets.Type.statusBars()).top;
            } else {
                topInset = insets.getSystemWindowInsetTop();
            }

            FrameLayout.LayoutParams updatedParams =
                (FrameLayout.LayoutParams) statusBarBackground.getLayoutParams();
            updatedParams.height = topInset;
            statusBarBackground.setLayoutParams(updatedParams);
            applySystemBars();
            return insets;
        });
    }

    private void applySystemBars() {
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        }
        window.getDecorView().setSystemUiVisibility(
            window.getDecorView().getSystemUiVisibility()
                & ~View.SYSTEM_UI_FLAG_FULLSCREEN
                & ~View.SYSTEM_UI_FLAG_IMMERSIVE
                & ~View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
        window.setStatusBarColor(SYSTEM_BAR_GREEN);
        window.setNavigationBarColor(SYSTEM_BAR_GREEN);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.show(android.view.WindowInsets.Type.statusBars() | android.view.WindowInsets.Type.navigationBars());
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        } else {
            int flags = window.getDecorView().getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_FULLSCREEN;
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
    }
}
