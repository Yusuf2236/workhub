import SwiftUI
import WebKit

/// WorkHub iOS WebBridge Container
///
/// Seamlessly embeds and synchronizes with the WZone web portal in real-time.
/// All platform updates, vacancies, OneID authentication, and chat are immediately
/// available in the iOS client without app re-compilation.
struct WorkHubWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool

    init(url: URL = URL(string: "http://localhost:3000")!, isLoading: Binding<Bool> = .constant(false)) {
        self.url = url
        self._isLoading = isLoading
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true

        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = preferences
        config.allowsInlineMediaPlayback = true

        // User script bridge
        let contentController = WKUserContentController()
        config.userContentController = contentController

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.backgroundColor = UIColor(red: 9/255, green: 14/255, blue: 26/255, alpha: 1)
        webView.isOpaque = false

        // Pull to refresh
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(context.coordinator, action: #selector(Coordinator.onRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl

        let request = URLRequest(url: url)
        webView.load(request)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // Keep current state
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WorkHubWebView

        init(_ parent: WorkHubWebView) {
            self.parent = parent
        }

        @objc func onRefresh(_ sender: UIRefreshControl) {
            sender.endRefreshing()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }
    }
}
