import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  change?: string
}

export default function StatsCard({ title, value, icon: Icon, color, bgColor, change }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {change && (
          <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
  )
}
