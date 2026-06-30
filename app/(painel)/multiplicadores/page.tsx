import { ListaMultiplicadores } from '@/components/multiplicadores/lista-multiplicadoras'

export default function MultiplicadoresPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-heading font-bold mb-6">Multiplicadores</h1>
      <ListaMultiplicadores />
    </div>
  )
}
