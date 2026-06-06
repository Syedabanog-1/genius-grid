'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Category } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const COLOR_OPTIONS = [
  { label: 'Pink', value: 'bg-pink-100' },
  { label: 'Violet', value: 'bg-violet-100' },
  { label: 'Blue', value: 'bg-blue-100' },
  { label: 'Green', value: 'bg-green-100' },
  { label: 'Orange', value: 'bg-orange-100' },
  { label: 'Fuchsia', value: 'bg-fuchsia-100' },
  { label: 'Yellow', value: 'bg-yellow-100' },
  { label: 'Indigo', value: 'bg-indigo-100' },
]

interface FormState {
  name: string
  icon: string
  color: string
}

const defaultForm: FormState = { name: '', icon: '📚', color: 'bg-pink-100' }

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const supabase = createClient()
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleOpen = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id)
      setForm({ name: cat.name, icon: cat.icon, color: cat.color })
    } else {
      setEditingId(null)
      setForm(defaultForm)
    }
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setLoading(true)

    if (editingId) {
      const { data, error } = await supabase
        .from('categories')
        .update({ name: form.name, icon: form.icon, color: form.color })
        .eq('id', editingId)
        .select()
        .single()

      if (!error && data) {
        setCategories((prev) => prev.map((c) => (c.id === editingId ? data : c)))
      }
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: form.name, icon: form.icon, color: form.color })
        .select()
        .single()

      if (!error && data) {
        setCategories((prev) => [data, ...prev])
      }
    }

    setLoading(false)
    handleClose()
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
    setDeleteId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
          <p className="text-slate-500 text-sm mt-1">Manage quiz categories</p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primaryHover transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Icon (emoji)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="📚"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className={`${c.value} h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                        form.color === c.value ? 'border-primary scale-105' : 'border-transparent'
                      }`}
                    >
                      {form.color === c.value && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Preview</label>
                <div
                  className={`${form.color} w-28 h-28 rounded-3xl p-4 flex flex-col items-start justify-between relative overflow-hidden`}
                >
                  <span className="font-bold text-primary z-10 text-sm">{form.name || 'Category'}</span>
                  <div className="absolute -bottom-2 -right-2 text-5xl opacity-50">
                    {form.icon}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primaryHover transition-colors disabled:opacity-60 shadow-soft"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 font-medium">No categories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`${cat.color} rounded-3xl p-5 relative overflow-hidden group`}
            >
              <div className="flex items-start justify-between mb-8 relative z-10">
                <span className="font-bold text-primary">{cat.name}</span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpen(cat)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleteId === cat.id}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 text-6xl opacity-40">
                {cat.icon}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
