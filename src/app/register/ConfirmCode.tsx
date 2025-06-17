import { getHabboProfile } from "../commons/HabboProfile";
import type { HabboProfile } from "../commons/HabboProfile";

/**
 * Interface para o resultado da confirmação do código
 */
export interface ConfirmCodeResult {
  success: boolean;
  error?: string;
  profile?: HabboProfile;
}

/**
 * Confirma se o código fornecido está na missão do perfil Habbo
 * @param nick - Nome do usuário Habbo
 * @param code - Código para verificar na missão
 * @returns Resultado da confirmação
 */
export async function confirmCode(
  nick: string,
  code: string,
): Promise<ConfirmCodeResult> {
  try {
    // Validação de entrada
    if (!nick || typeof nick !== "string" || !nick.trim()) {
      return {
        success: false,
        error: "Nick é obrigatório",
      };
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return {
        success: false,
        error: "Código é obrigatório",
      };
    }

    const profile = await getHabboProfile(nick.trim());

    if (profile.motto !== code.trim()) {
      return {
        success: false,
        error:
          "O código não confere com a sua missão. Atualize e tente novamente.",
        profile,
      };
    }

    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error("Erro ao confirmar código:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao verificar perfil",
    };
  }
}
