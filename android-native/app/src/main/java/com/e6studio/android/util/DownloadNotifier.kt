package com.e6studio.android.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.e6studio.android.R

object DownloadNotifier {
    const val CHANNEL_ID = "downloads"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Загрузки E6Studio",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Показывает состояние сохранения файлов и открытие скачанного результата"
        }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    fun showProgress(context: Context, notificationId: Int, title: String, text: String) {
        ensureChannel(context)
        NotificationManagerCompat.from(context).notify(
            notificationId,
            NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setOnlyAlertOnce(true)
                .setOngoing(true)
                .setProgress(0, 0, true)
                .build()
        )
    }

    fun showFinished(
        context: Context,
        notificationId: Int,
        title: String,
        text: String,
        openIntent: Intent?
    ) {
        ensureChannel(context)
        val pendingIntent = openIntent?.let {
            PendingIntent.getActivity(
                context,
                notificationId,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
        NotificationManagerCompat.from(context).notify(
            notificationId,
            NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()
        )
    }

    fun showError(context: Context, notificationId: Int, title: String, text: String) {
        ensureChannel(context)
        NotificationManagerCompat.from(context).notify(
            notificationId,
            NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_error)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .build()
        )
    }
}
