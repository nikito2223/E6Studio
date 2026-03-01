package com.e6studio.android.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.e6studio.android.databinding.ItemStringBinding

class StringListAdapter(
    private val onClick: (String) -> Unit
) : RecyclerView.Adapter<StringListAdapter.VH>() {

    private val items = mutableListOf<String>()

    fun submit(list: List<String>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemStringBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b, onClick)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(items[position])

    class VH(private val b: ItemStringBinding, private val onClick: (String) -> Unit) : RecyclerView.ViewHolder(b.root) {
        fun bind(text: String) {
            b.title.text = text
            b.root.setOnClickListener { onClick(text) }
        }
    }
}
