package com.e6studio.mobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.mozilla.geckoview.*

class MainActivity : AppCompatActivity() {

    private lateinit var geckoView: GeckoView
    private lateinit var session: GeckoSession
    private lateinit var runtime: GeckoRuntime
    private val repository = DataRepository()
    private lateinit var billingManager: BillingManager
    private val gson = Gson()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        geckoView = findViewById(R.id.geckoView)
        runtime = GeckoRuntime.create(this)
        session = GeckoSession()
        session.open(runtime)
        geckoView.setSession(session)

        billingManager = BillingManager(this) { event ->
            sendToJs("onNativeEvent", event)
        }
        billingManager.connect()

        session.promptDelegate = object : GeckoSession.PromptDelegate {
            override fun onPrompt(
                session: GeckoSession,
                prompt: PromptDelegate.PromptInstance
            ): GeckoResult<PromptDelegate.PromptResponse>? {
                if (prompt is PromptDelegate.TextPrompt && prompt.message.startsWith("bridge:")) {
                    handleBridge(prompt.message.removePrefix("bridge:"))
                    return GeckoResult.fromValue(prompt.dismiss())
                }
                return GeckoResult.fromValue(prompt.dismiss())
            }
        }

        session.loadUri("file:///android_asset/ui/index.html")
    }

    private fun handleBridge(payload: String) {
        when {
            payload.startsWith("loadPosts|") -> {
                val parts = payload.split("|")
                val tags = parts.getOrNull(1) ?: ""
                val page = parts.getOrNull(2)?.toIntOrNull() ?: 1
                lifecycleScope.launch {
                    val posts = withContext(Dispatchers.IO) { repository.loadPosts(tags, page) }
                    sendToJs("renderPosts", gson.toJson(posts))
                }
            }

            payload.startsWith("buy|") -> {
                billingManager.launchPurchase(payload.removePrefix("buy|"))
            }
        }
    }

    private fun sendToJs(functionName: String, jsonPayload: String) {
        val escaped = jsonPayload
            .replace("\\", "\\\\")
            .replace("'", "\\'")
        session.evaluateJS("window.NativeBridge.${functionName}('${escaped}')")
    }
}
