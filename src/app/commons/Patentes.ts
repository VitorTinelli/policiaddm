export interface Patente {
  id: number;
  patente: string;
}

// Lista completa de patentes disponíveis para venda (excluindo comandante supremo)
export const PATENTES_DISPONIVEIS: Patente[] = [
  { id: 1, patente: "Soldado" },
  { id: 2, patente: "Cabo" },
  { id: 3, patente: "Sargento" },
  { id: 4, patente: "Subtenente" },
  { id: 5, patente: "Aspirante a oficial" },
  { id: 6, patente: "Tenente" },
  { id: 7, patente: "Capitao" },
  { id: 8, patente: "Major" },
  { id: 9, patente: "Coronel" },
  { id: 10, patente: "General" },
  { id: 11, patente: "Marechal" },
  { id: 12, patente: "Comandante" },
  { id: 13, patente: "Comandante-geral" }
];

// Função para obter o nome da patente pelo ID
export function getNomePatenteById(id: number): string {
  const patente = PATENTES_DISPONIVEIS.find(p => p.id === id);
  return patente?.patente || "Patente desconhecida";
}

// Função para obter o ID da patente pelo nome
export function getIdPatenteByNome(nome: string): number | null {
  const patente = PATENTES_DISPONIVEIS.find(p => p.patente.toLowerCase() === nome.toLowerCase());
  return patente?.id || null;
}
