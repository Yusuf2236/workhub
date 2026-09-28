package com.workhub.app.ui.screens

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.*
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

/**
 * WorkHub WebBridge Container
 * 
 * Provides seamless 1:1 synchronization with the WZone web portal.
 * All new features, OneID verification, vacancy postings, and chat are automatically
 * rendered without requiring app updates.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebBridgeScreen(
    url: String = "http://10.0.2.2:3000",
    onSwitchToNative: (() -> Unit)? = null
) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var progress by remember { mutableFloatStateOf(0f) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    val context = LocalContext.current

    // Android Hardware Back Navigation
    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        webViewInstance?.goBack()
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF090E1A))) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = android.view.ViewGroup.LayoutParams(
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        allowFileAccess = true
                        allowContentAccess = true
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                        setSupportZoom(false)
                    }

                    // Security Bridge
                    addJavascriptInterface(object {
                        @JavascriptInterface
                        fun onTokenReceived(token: String) {
                            com.workhub.app.data.api.ApiClient.authToken = token
                        }

                        @JavascriptInterface
                        fun getAppVersion(): String = "1.0.0"

                        @JavascriptInterface
                        fun getPlatform(): String = "android"
                    }, "WorkHubAndroidBridge")

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            view: WebView?,
                            request: WebResourceRequest?
                        ): Boolean {
                            val targetUrl = request?.url?.toString() ?: return false
                            return if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
                                false // Keep within app
                            } else {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl))
                                    context.startActivity(intent)
                                    true
                                } catch (e: Exception) {
                                    true
                                }
                            }
                        }

                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            super.onPageStarted(view, url, favicon)
                            isLoading = true
                            hasError = false
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            isLoading = false
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            super.onReceivedError(view, request, error)
                            if (request?.isForMainFrame == true) {
                                hasError = true
                                errorMessage = error?.description?.toString() ?: "Ulanishda xatolik yuz berdi"
                                isLoading = false
                            }
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                            super.onProgressChanged(view, newProgress)
                            progress = newProgress / 100f
                            if (newProgress >= 100) {
                                isLoading = false
                            }
                        }
                    }

                    loadUrl(url)
                    webViewInstance = this
                }
            },
            update = {
                // Keep active
            }
        )

        // Linear Progress Bar during navigation
        if (isLoading && progress < 1f) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(3.dp).align(Alignment.TopCenter),
                color = Color(0xFF2563EB),
                trackColor = Color.Transparent,
            )
        }

        // Connection Error Screen with Retry
        AnimatedVisibility(
            visible = hasError,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF1E293B))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "⚠️ Aloqa uzildi",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "WorkHub serveriga ulanib bo‘lmadi.\nInternet aloqangizni tekshiring.",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = {
                            hasError = false
                            isLoading = true
                            webViewInstance?.reload()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                    ) {
                        Text("Qayta urinish", fontWeight = FontWeight.Bold)
                    }

                    if (onSwitchToNative != null) {
                        OutlinedButton(
                            onClick = onSwitchToNative,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Text("Oflayn rejim")
                        }
                    }
                }
            }
        }
    }
}
