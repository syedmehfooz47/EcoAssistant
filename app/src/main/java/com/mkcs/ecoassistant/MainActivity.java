package com.mkcs.ecoassistant; // Use your actual package name here

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.content.Intent;
import android.net.Uri;
import android.annotation.SuppressLint; // Needed for suppressLint

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled") // Suppress warning for enabling JavaScript
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main); // Links to your layout file

        webView = findViewById(R.id.webView); // Get the WebView from the layout

        // Configure WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Enable JavaScript (CRITICAL for chatbot)
        webSettings.setDomStorageEnabled(true); // Enable DOM Storage (needed for some web features/libs)
        webSettings.setAllowFileAccess(true); // Allow access to local files in assets (generally safe for file:///android_asset/)
        webSettings.setAllowFileAccessFromFileURLs(true); // Required for some interactions between asset files
        webSettings.setAllowUniversalAccessFromFileURLs(true); // May be needed if files reference each other extensively


        // Set a custom WebViewClient to handle page navigation within the app
        webView.setWebViewClient(new MyWebViewClient());

        // Load the initial HTML file from the assets folder
        webView.loadUrl("file:///android_asset/index.html");
    }

    // Custom WebViewClient to handle URL loading
    private class MyWebViewClient extends WebViewClient {

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();

            // Check if the URL is one of our local asset files
            if (url.startsWith("file:///android_asset/")) {
                // Let the WebView handle loading local files internally
                return false; // Returning false means WebView loads the URL
            } else {
                // For all other URLs (http, https, etc.), open them in an external browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    // Handle exceptions like no browser installed
                    e.printStackTrace();
                }
                return true; // Returning true means we handled the URL loading
            }
        }

        // Deprecated version for older Android versions (API < 24) - optional but good for compatibility
        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if (url.startsWith("file:///android_asset/")) {
                return false;
            } else {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
                return true;
            }
        }
    }

    // Handle the back button press
    @Override
    public void onBackPressed() {
        // If the WebView can navigate back in its history, do that
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            // Otherwise, perform the default back button action (exit activity)
            super.onBackPressed();
        }
    }
}