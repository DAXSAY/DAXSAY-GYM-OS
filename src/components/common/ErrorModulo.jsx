import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Si un apartado falla al dibujarse, muestra un aviso en lugar de dejar la
// pantalla en blanco; el resto del sistema sigue funcionando.
export class ErrorModulo extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Error en el apartado", error, info?.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center max-w-lg mx-auto my-10 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Este apartado no se pudo mostrar</h2>
        <p className="text-sm text-slate-500">
          Tus datos están a salvo. Vuelve a intentarlo; si se repite, avisa a administración con este detalle:
        </p>
        <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-rose-700 break-words">
          {String(this.state.error?.message || this.state.error)}
        </code>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }
}
