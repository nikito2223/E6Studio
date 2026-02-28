package com.e6studio.mobile

import android.app.Activity
import com.android.billingclient.api.*

class BillingManager(
    private val activity: Activity,
    private val onEvent: (String) -> Unit
) : PurchasesUpdatedListener {

    private val client: BillingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
        )
        .build()

    fun connect() {
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                onEvent("billing_ready:${result.responseCode}")
            }

            override fun onBillingServiceDisconnected() {
                onEvent("billing_disconnected")
            }
        })
    }

    fun launchPurchase(skuId: String) {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(skuId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                )
            )
            .build()

        client.queryProductDetailsAsync(params) { result, list ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK || list.isEmpty()) {
                onEvent("purchase_error:${result.responseCode}")
                return@queryProductDetailsAsync
            }
            val product = list.first()
            val flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(
                    listOf(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(product)
                            .build()
                    )
                )
                .build()
            client.launchBillingFlow(activity, flow)
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        onEvent("purchase_result:${result.responseCode}:${purchases?.size ?: 0}")
    }
}
