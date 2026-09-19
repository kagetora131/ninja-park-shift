import type { ChatConversation, ChatDirectoryEntry, Employee } from '../types';

export interface ChatPersonDisplay {
  name: string;
  /** employees行に紐づく相手ならEmployeeを返す(アバター表示用)。マネージャーはundefined。 */
  employee?: Employee;
}

/**
 * profile_idから表示名・アバター元データを解決する。
 * マネージャーはemployees行を持たないため、その場合はmanagerLabel(「忍者頭領(マネージャー)」)を返す。
 */
export function resolveChatPerson(
  profileId: string,
  directory: ChatDirectoryEntry[],
  employeeMap: Map<string, Employee>,
  employeeName: (employee: Employee) => string,
  managerLabel: string,
): ChatPersonDisplay {
  const entry = directory.find((d) => d.profileId === profileId);
  if (entry?.employeeId) {
    const employee = employeeMap.get(entry.employeeId);
    if (employee) return { name: employeeName(employee), employee };
  }
  return { name: managerLabel };
}

/** 会話一覧・スレッドヘッダーで共通して使う表示名の解決(業務連絡/グループ/個人チャットで分岐)。 */
export function getConversationDisplayName(
  conversation: ChatConversation,
  memberProfileIds: string[],
  directory: ChatDirectoryEntry[],
  employeeMap: Map<string, Employee>,
  myProfileId: string,
  employeeName: (employee: Employee) => string,
  broadcastName: string,
  managerLabel: string,
): string {
  if (conversation.type === 'broadcast') return broadcastName;
  if (conversation.type === 'group') return conversation.name ?? broadcastName;
  const otherId = memberProfileIds.find((id) => id !== myProfileId) ?? memberProfileIds[0];
  return resolveChatPerson(otherId, directory, employeeMap, employeeName, managerLabel).name;
}
