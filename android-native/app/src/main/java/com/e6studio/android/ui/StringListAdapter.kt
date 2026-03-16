package com.e6studio.android.ui

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.e6studio.android.databinding.ItemStringBinding

class StringListAdapter(
    private val onClick: (String) -> Unit
) : RecyclerView.Adapter<StringListAdapter.VH>() {

    private val items = mutableListOf<String>()
    private var theme: String = "dark"

    fun submit(list: List<String>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    fun setTheme(value: String) {
        theme = value
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemStringBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b, onClick)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position], theme)

    class VH(private val b: ItemStringBinding, private val onClick: (String) -> Unit) : RecyclerView.ViewHolder(b.root) {
        fun bind(text: String, theme: String) {
            val textColor = if (theme == "light") Color.parseColor("#0B1B26") else Color.parseColor("#E8F1F7")
            val bgColor = when (theme) {
                "light" -> Color.parseColor("#EEF3F7")
                "blue" -> Color.parseColor("#12385D")
                "red" -> Color.parseColor("#2F1118")
                else -> Color.parseColor("#0F1D2B")
            }
            b.root.setBackgroundColor(bgColor)
            b.title.setTextColor(textColor)
            b.title.text = text
            b.root.setOnClickListener { onClick(text) }
        }
    }
}
