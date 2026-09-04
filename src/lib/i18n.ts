import type { Locale, Mood, MoodReason, FacilityId } from '../types';

/**
 * アプリ本体のUI文言(見出し・ボタン・警告メッセージ等)の辞書。
 * 従業員名・施設名などの「表記」はSupabaseの`labels`テーブル(useLabelContext)が別途担当するため、
 * ここで扱うのはデータに紐付かない静的なUIチャンプのみ。
 */
const STRINGS = {
  'header.appName': { ja: '忍者パークシフト', en: 'Ninja Park Shift' },
  'header.roleManager': { ja: '忍者頭領(マネージャー)', en: 'Manager' },
  'header.roleEmployee': { ja: '従業員', en: 'Staff' },
  'header.logout': { ja: 'ログアウト', en: 'Log out' },

  'login.heading': { ja: 'ログイン', en: 'Sign in' },
  'login.email': { ja: 'メールアドレス', en: 'Email address' },
  'login.password': { ja: 'パスワード', en: 'Password' },
  'login.submitting': { ja: 'ログイン中...', en: 'Signing in...' },
  'login.submit': { ja: 'ログイン', en: 'Log in' },

  'app.loading': { ja: '読み込み中...', en: 'Loading...' },
  'app.noEmployeeLinked': {
    ja: 'アカウントに紐づく従業員データが見つかりません。マネージャーにお問い合わせください。',
    en: 'No staff record is linked to this account. Please contact your manager.',
  },
  'app.profileFetchFailed': {
    ja: 'アカウント情報の取得に失敗しました。マネージャーにお問い合わせください。',
    en: 'Failed to load your account information. Please contact your manager.',
  },

  'tab.board': { ja: 'シフト表', en: 'Shift Board' },
  'tab.staff': { ja: 'スタッフ管理', en: 'Staff' },
  'tab.finance': { ja: '収支', en: 'Finance' },
  'tab.posts': { ja: '給与・ポスト設定', en: 'Wages & Staffing' },
  'tab.labels': { ja: '用語管理', en: 'Terminology' },
  'tab.myShifts': { ja: 'マイシフト', en: 'My Shifts' },
  'tab.myPreferences': { ja: '自分の設定', en: 'My Settings' },

  'common.cancel': { ja: 'キャンセル', en: 'Cancel' },
  'common.save': { ja: '保存', en: 'Save' },
  'common.delete': { ja: '削除', en: 'Delete' },
  'common.add': { ja: '追加', en: 'Add' },
  'common.desiredWorkDaysPerWeek': { ja: '希望勤務日数/週', en: 'Desired Work Days / Week' },
  'common.maxConsecutiveDays': { ja: '連勤上限(日)', en: 'Max Consecutive Days' },
  'common.desiredDaysOff': { ja: '希望休み曜日', en: 'Preferred Days Off' },

  'shiftBoard.staffHeader': { ja: 'スタッフ', en: 'Staff' },
  'shiftBoard.autoAssigning': { ja: '自動配置中...', en: 'Auto-assigning...' },
  'shiftBoard.autoAssign': { ja: 'スタッフの自動配置', en: 'Auto-assign Staff' },
  'shiftBoard.blackDays': { ja: '今月の黒字日数：{black} / {total}日', en: 'Profitable days this month: {black} / {total}' },
  'shiftBoard.desiredWorkAndMax': {
    ja: '週{days}日希望・連勤上限{max}日',
    en: 'Wants {days}d/wk · max {max} consecutive',
  },
  'shiftBoard.offWeekdayTitle': { ja: '{day}曜は希望休み', en: 'Usually off on {day}' },
  'shiftBoard.mainFacilityBadge': { ja: '所属：{facility}(ドラッグして配置)', en: 'Home: {facility} (drag to assign)' },
  'shiftBoard.helpFacilityBadge': { ja: '応援可：{facility}(ドラッグして配置)', en: 'Can help: {facility} (drag to assign)' },
  'shiftBoard.unfamiliarNotice': {
    ja: '{employee}は{facility}が未経験です。無理のないシフトか確認しましょう。',
    en: "{employee} hasn't worked at {facility} before — please double-check this is a reasonable shift.",
  },
  'shiftBoard.swapNotice': { ja: '{a}と{b}の配置を入れ替えました', en: 'Swapped shifts between {a} and {b}.' },
  'shiftBoard.autoAssignNone': {
    ja: 'この月はすでにポスト設定の必要人数を満たしています',
    en: 'This month already meets the required staffing levels.',
  },
  'shiftBoard.autoAssignSuccess': { ja: '{n}件のシフトを自動配置しました', en: 'Auto-assigned {n} shift(s).' },
  'shiftBoard.autoAssignPartial': {
    ja: '{created}件を自動配置しましたが、{missing}件は対応可能な忍者が見つかりませんでした',
    en: "Auto-assigned {created} shift(s), but couldn't find anyone available for {missing} slot(s).",
  },
  'shiftBoard.legend': {
    ja: '施設バッジをセルへドラッグして新規配置、配置済みセルをドラッグすると別の日付・従業員へ移動(空きセル)または入れ替え(配置済みセル)ができます。クリックで詳細編集。右上のドットは表情(緑=上機嫌／灰=普通／金=疲れ気味／朱=不満)。',
    en: 'Drag a facility badge onto a cell to assign a new shift. Drag an existing shift to move it (empty cell) or swap it (filled cell). Click a cell for detailed editing. The dot in the top-right shows mood (green = happy, gray = neutral, gold = tired, red = unhappy).',
  },

  'myShifts.viewOnlyNotice': {
    ja: 'シフトの閲覧のみです(編集はマネージャーが行います)',
    en: 'View only — your manager makes edits.',
  },
  'myShifts.dateHeader': { ja: '日付', en: 'Date' },
  'myShifts.placementHeading': { ja: '{date} の配置', en: 'Staffing for {date}' },
  'myShifts.attendanceCount': { ja: '{n}名出勤', en: '{n} working' },
  'myShifts.noPlacement': { ja: '配置なし', en: 'No one scheduled' },
  'myShifts.you': { ja: '(あなた)', en: ' (You)' },
  'myShifts.swapCandidatesHeading': { ja: '交代候補', en: 'Swap Candidates' },
  'myShifts.swapExplain': {
    ja: 'この日({facility}・{start}–{end})を代わってもらえそうな、対応可能かつこの日は空いている忍者です。交代したい場合はマネージャーに相談してください。',
    en: "These ninjas can cover this shift ({facility}, {start}–{end}) — they're qualified and free that day. Talk to your manager if you'd like to arrange a swap.",
  },
  'myShifts.noSwapCandidates': {
    ja: '現在、対応可能で空いている忍者はいません',
    en: 'No one qualified is currently available.',
  },

  'coverage.heading': { ja: 'ポスト充足状況', en: 'Staffing Coverage' },
  'coverage.description': {
    ja: '給与・ポスト設定の必要人数(曜日×施設)と、実際の配置人数を比較しています。',
    en: 'Compares required staffing (by weekday and facility, from Wages & Staffing) with actual assignments.',
  },
  'coverage.empty': { ja: '不在', en: 'Unstaffed' },
  'coverage.short': { ja: '不足', en: 'Short' },
  'coverage.over': { ja: '過多', en: 'Over' },
  'coverage.allGood': {
    ja: 'この月は必要人数どおりに配置されています',
    en: 'Staffing meets requirements for this month.',
  },
  'coverage.statusEmpty': { ja: '誰もいない', en: 'No one scheduled' },
  'coverage.statusShort': { ja: '人員不足', en: 'Understaffed' },
  'coverage.statusOver': { ja: '人員過多', en: 'Overstaffed' },
  'coverage.rowSummary': { ja: '{actual}/{required}名・{status}', en: '{actual}/{required} · {status}' },

  'posts.wageHeading': { ja: 'ポジション別時給・給与', en: 'Position Pay Rates' },
  'posts.wageDescription': {
    ja: '給与は従業員ごとではなく、ポジション(施設・雇用形態)ごとに設定します。収支の人件費はこの設定を使って自動計算されます。',
    en: 'Pay is set per position (facility/employment type) rather than per employee. Labor cost in Finance is calculated automatically from these rates.',
  },
  'posts.facilityStaffSuffix': { ja: '{facility}スタッフ', en: '{facility} Staff' },
  'posts.yenPerHour': { ja: '円/時', en: '/hr' },
  'posts.traineeStaff': { ja: '研修中スタッフ(施設によらず一律)', en: 'Trainees (flat rate, any facility)' },
  'posts.fulltimeStaff': {
    ja: '社員(月給、稼働した日に日割りで按分)',
    en: 'Full-time staff (monthly salary, pro-rated by days worked)',
  },
  'posts.yenPerMonthSuffix': { ja: '円/月(÷{days}日で日割り)', en: '/mo (÷{days} days, pro-rated)' },
  'posts.requirementsHeading': { ja: 'ポスト設定(曜日パターン)', en: 'Staffing Requirements (Weekly Pattern)' },
  'posts.requirementsDescription': {
    ja: '曜日ごとに施設の必要人数を設定します。同じ曜日は期間中すべての日に適用されます。空欄は「設定なし」(過不足を表示しません)。',
    en: 'Set the required headcount per facility for each weekday. The same weekday applies to every date in the period. Leave blank for "not set" (no shortage/surplus shown).',
  },
  'posts.weekdayHeader': { ja: '曜日', en: 'Weekday' },

  'labels.heading': { ja: '用語管理(表記)', en: 'Terminology' },
  'labels.description': {
    ja: '従業員名・施設名などの「表記」を言語ごとに管理します。「翻訳」ではなくローマ字化・呼称の切り替えという位置づけです。英語(en)を空欄のまま保存すると、表示時は日本語(ja)にフォールバックします。',
    en: 'Manage per-language "notations" for staff names, facility names, and more — this is romanization/renaming, not machine translation. Leaving English (en) blank falls back to Japanese (ja) when displayed.',
  },
  'labels.entityEmployee': { ja: '従業員名', en: 'Staff Name' },
  'labels.entityFacility': { ja: '施設名', en: 'Facility Name' },
  'labels.entityRole': { ja: '役割名', en: 'Role Name' },
  'labels.entityQualification': { ja: '資格名', en: 'Qualification Name' },
  'labels.noneRegistered': { ja: '登録された表記はありません', en: 'No notations registered yet.' },
  'labels.idHeader': { ja: 'ID', en: 'ID' },
  'labels.jaHeader': { ja: '日本語(ja)', en: 'Japanese (ja)' },
  'labels.enHeader': { ja: '英語(en)', en: 'English (en)' },
  'labels.enPlaceholder': {
    ja: '(未設定→日本語表記にフォールバック)',
    en: '(unset → falls back to Japanese)',
  },
  'labels.saved': { ja: '保存済み', en: 'Saved' },
  'labels.deleteTitle': { ja: 'この表記を削除', en: 'Delete this notation' },
  'labels.addHeading': { ja: '新しい表記を追加', en: 'Add a New Notation' },
  'labels.addDescription': {
    ja: '将来、施設や役職が増えた場合もここから表記を追加できます(コード変更不要)。',
    en: 'Add notations here for future facilities or roles too — no code changes needed.',
  },
  'labels.idPlaceholder': { ja: 'ID(例: kitchen)', en: 'ID (e.g. kitchen)' },
  'labels.fieldPlaceholder': { ja: '項目(既定: label)', en: 'Field (default: label)' },
  'labels.jaPlaceholder': { ja: '日本語表記', en: 'Japanese notation' },
  'labels.enOptionalPlaceholder': { ja: '英語表記(任意)', en: 'English notation (optional)' },

  'employeeModal.hireHeading': { ja: '新しい忍者を雇う', en: 'Hire a New Staff Member' },
  'employeeModal.editHeading': { ja: '忍者情報を編集', en: 'Edit Staff Details' },
  'employeeModal.name': { ja: '名前', en: 'Name' },
  'employeeModal.roleLabel': { ja: '雇用形態', en: 'Employment Type' },
  'employeeModal.fulltimeSalaryNote': {
    ja: '※人件費は「給与・ポスト設定」の社員月給を日割りして自動計算されます',
    en: '※ Labor cost is calculated automatically by pro-rating the full-time monthly salary in "Wages & Staffing."',
  },
  'employeeModal.mainFacility': { ja: '所属施設', en: 'Home Facility' },
  'employeeModal.crossTrained': { ja: '応援可能な施設(掛け持ち)', en: 'Facilities They Can Help At' },
  'employeeModal.qualificationCheckbox': {
    ja: '資格：手裏剣・忍具取り扱い研修修了(修行アトラクションに必要)',
    en: 'Certified: Shuriken & Ninja Tool Handling (required for the Training Attraction)',
  },
  'employeeModal.cafeKitchenCheckbox': {
    ja: '忍者茶屋の厨房対応が可能',
    en: 'Can work the Ninja Tea House kitchen',
  },
  'employeeModal.traineeCheckbox': {
    ja: '研修中(人件費は「研修中時給」が優先適用されます)',
    en: 'Trainee (the trainee hourly rate takes priority for labor cost)',
  },
  'employeeModal.employmentTypeNote': {
    ja: '備考(求人用の雇用形態表記など)',
    en: 'Note (e.g. employment-type wording for job listings)',
  },
  'employeeModal.employmentTypePlaceholder': { ja: '契約社員', en: 'e.g. Contract Staff' },
  'employeeModal.createAccountCheckbox': {
    ja: 'ログインアカウントも作成する(任意)',
    en: 'Also create a login account (optional)',
  },
  'employeeModal.accountEmailPlaceholder': { ja: 'メールアドレス', en: 'Email address' },
  'employeeModal.accountPasswordPlaceholder': { ja: '初期パスワード', en: 'Initial password' },
  'employeeModal.accountCreateFailed': { ja: 'アカウント作成に失敗しました', en: 'Failed to create the account.' },
  'employeeModal.delete': { ja: '退職(削除)', en: 'Remove (Delete)' },
  'employeeModal.confirmDeleteWithShifts': {
    ja: 'この忍者を退職させますか？割り当て済みのシフト{count}件も一緒に削除されます。',
    en: 'Remove this staff member? Their {count} assigned shift(s) will also be deleted.',
  },
  'employeeModal.confirmDelete': { ja: 'この忍者を退職させますか？', en: 'Remove this staff member?' },

  'financeModal.heading': { ja: '売上を編集', en: 'Edit Revenue' },
  'financeModal.revenueLabel': { ja: '売上(円)', en: 'Revenue (¥)' },
  'financeModal.autoCalcNote': {
    ja: '人件費はシフト実働時間と「給与・ポスト設定」の給与から自動計算されます。',
    en: 'Labor cost is calculated automatically from shift hours and the rates in "Wages & Staffing."',
  },

  'finance.periodRevenue': { ja: '期間合計 売上', en: 'Total Revenue' },
  'finance.periodLabor': { ja: '期間合計 人件費', en: 'Total Labor Cost' },
  'finance.periodProfit': { ja: '期間合計 損益', en: 'Total Profit/Loss' },
  'finance.redStreak': {
    ja: '赤字が{n}日連続しています（〜{endDate}）。人員配置の見直しを検討しましょう。',
    en: 'Losses have continued for {n} day(s) (through {endDate}). Consider reviewing staffing.',
  },
  'finance.dailyChart': { ja: '日別損益', en: 'Daily Profit/Loss' },
  'finance.detailHeading': { ja: '{date} の施設別内訳', en: 'Facility Breakdown for {date}' },
  'finance.black': { ja: '黒字', en: 'Profit' },
  'finance.red': { ja: '赤字', en: 'Loss' },
  'finance.editRevenueTitle': { ja: '売上を編集', en: 'Edit revenue' },
  'finance.revenue': { ja: '売上', en: 'Revenue' },
  'finance.laborAuto': { ja: '人件費(自動計算)', en: 'Labor cost (auto)' },
  'finance.margin': { ja: '差引', en: 'Net' },

  'staff.heading': { ja: 'スタッフ一覧({n}名)', en: 'Staff ({n})' },
  'staff.hire': { ja: '新しい忍者を雇う', en: 'Hire New Staff' },
  'staff.traineeSuffix': { ja: '・研修中', en: ' · Trainee' },
  'staff.crossTrainedPrefix': { ja: '応援可：{list}', en: 'Can help: {list}' },

  'avatarPicker.previewAlt': { ja: 'プレビュー', en: 'Preview' },
  'avatarPicker.gender': { ja: '性別', en: 'Gender' },
  'avatarPicker.male': { ja: '男性', en: 'Male' },
  'avatarPicker.female': { ja: '女性', en: 'Female' },
  'avatarPicker.skinColor': { ja: '肌の色', en: 'Skin Tone' },
  'avatarPicker.skinColorTitle': { ja: '肌の色を選択', en: 'Choose skin tone' },
  'avatarPicker.hair': { ja: '髪型', en: 'Hairstyle' },
  'avatarPicker.glasses': { ja: '眼鏡', en: 'Glasses' },
  'avatarPicker.wearGlasses': { ja: 'かける', en: 'Wear glasses' },

  'datePicker.selectDate': { ja: '日付を選択', en: 'Select a date' },

  'prefs.heading': { ja: '自分の設定', en: 'My Settings' },
  'prefs.desiredDaysOffWeekly': { ja: '希望休み曜日(毎週の傾向)', en: 'Preferred Days Off (Weekly Pattern)' },
  'prefs.offCalendarHeading': { ja: '希望休みカレンダー(特定の日付)', en: 'Specific Days-Off Calendar' },
  'prefs.offCalendarDescription': {
    ja: '旅行や用事など、特定の日だけ休みたい場合はカレンダーの日付をタップして指定してください。指定した日に配置されると、あなたの忍者は不満そうな表情になります。',
    en: "For trips or errands on a specific day, tap the date on the calendar to mark it. If you're scheduled on a marked day, your ninja will look unhappy.",
  },
  'prefs.selectedDatesPrefix': { ja: '指定中：{list}', en: 'Selected: {list}' },
  'prefs.saving': { ja: '保存中...', en: 'Saving...' },
  'prefs.saved': { ja: '保存しました', en: 'Saved!' },
  'prefs.saveFailed': { ja: '保存に失敗しました', en: 'Failed to save.' },

  'shiftEditModal.createHeading': { ja: '配置を追加', en: 'Add Shift' },
  'shiftEditModal.editHeading': { ja: 'シフトを編集', en: 'Edit Shift' },
  'shiftEditModal.assignee': { ja: '担当者', en: 'Staff Member' },
  'shiftEditModal.helpNotice': {
    ja: '※本来は{facility}所属の応援配置になります',
    en: '※ This is a help shift outside their home facility ({facility})',
  },
  'shiftEditModal.unfamiliarSuffix': { ja: '（未経験の施設）', en: ' (unfamiliar facility)' },
  'shiftEditModal.facility': { ja: '配置施設', en: 'Facility' },
  'shiftEditModal.commonTimes': { ja: 'よく使う時間帯', en: 'Common Time Slots' },
  'shiftEditModal.start': { ja: '開始', en: 'Start' },
  'shiftEditModal.end': { ja: '終了', en: 'End' },
  'shiftEditModal.breakMinutes': { ja: '休憩(分)', en: 'Break (min)' },
  'shiftEditModal.isDesired': { ja: '本人の希望通りのシフトである', en: 'Matches their preferences' },
  'shiftEditModal.note': { ja: '備考', en: 'Note' },
  'shiftEditModal.notePlaceholder': { ja: '例：繁忙のため応援 など', en: 'e.g. Covering for a busy period' },

  'reason.offDateRequested': {
    ja: 'カレンダーで指定した希望休みの日に出勤している',
    en: 'Working on a specifically requested day off',
  },
  'reason.offWeekdayRequested': {
    ja: '希望休みの曜日に出勤している',
    en: 'Working on a usual requested day off',
  },
  'reason.severeOverrun': {
    ja: '連勤上限({max}日)を{overrun}日超過',
    en: 'Exceeds the {max}-day consecutive-work limit by {overrun} day(s)',
  },
  'reason.unfamiliarHelpUndesired': {
    ja: '希望と異なり、未経験の施設へ応援に入っている',
    en: 'Unexpectedly helping at an unfamiliar facility',
  },
  'reason.consecutiveDays': { ja: '{n}連勤目', en: 'Day {n} of consecutive work' },
  'reason.overrun': { ja: '連勤上限({max}日)を超過', en: 'Exceeds the {max}-day consecutive-work limit' },
  'reason.unfamiliarHelpContinuing': {
    ja: '不慣れな施設への応援が続いている',
    en: 'Continuing to help at an unfamiliar facility',
  },
  'reason.adjustedFromDesired': { ja: '希望と少し異なるシフト調整あり', en: 'Slightly adjusted from preferences' },
  'reason.helpOnce': { ja: '他施設への応援が1回ある', en: 'Helped at another facility once' },
  'reason.allGood': {
    ja: '希望通りのシフトで、連勤も無理がない',
    en: 'Shift matches preferences with no excessive consecutive days',
  },

  'avatar.helpBadgeTitle': { ja: '本来は{facility}所属', en: 'Normally at {facility}' },

  'mood.happy': { ja: '上機嫌', en: 'Happy' },
  'mood.neutral': { ja: '普通', en: 'Neutral' },
  'mood.tired': { ja: '疲れ気味', en: 'Tired' },
  'mood.unhappy': { ja: '不満', en: 'Unhappy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type StringKey = keyof typeof STRINGS;

/** UI文言辞書から現在の言語の文言を取得し、{param}形式のプレースホルダーを置換する。 */
export function t(key: StringKey, locale: Locale, params?: Record<string, string | number>): string {
  let str: string = STRINGS[key][locale] ?? STRINGS[key].ja;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/** 表情判定の理由(mood.ts生成のキー+パラメータ)を、現在の言語の文言に変換する。 */
export function translateReason(reason: MoodReason, locale: Locale): string {
  return t(`reason.${reason.key}` as StringKey, locale, reason.params);
}

export function moodLabel(mood: Mood, locale: Locale): string {
  return t(`mood.${mood}` as StringKey, locale);
}

const WEEKDAY_EN_BY_JA: Record<string, string> = {
  月: 'Mon',
  火: 'Tue',
  水: 'Wed',
  木: 'Thu',
  金: 'Fri',
  土: 'Sat',
  日: 'Sun',
};

/** WEEKDAYS/WEEKDAY_HEADERS等の日本語1文字曜日表記を、現在の言語の短縮表記に変換する。 */
export function weekdayLabel(ja: string, locale: Locale): string {
  if (locale === 'ja') return ja;
  return WEEKDAY_EN_BY_JA[ja] ?? ja;
}

const FACILITY_SHORT_EN: Record<FacilityId, string> = {
  goods: 'Goods',
  amuse: 'Training',
  cafe: 'Tea House',
};

/** 施設のコンパクトな短縮表記(バッジ等の狭いスペース向け)。日本語はshortName、英語は専用の短縮語を使う。 */
export function facilityShortLabel(facilityId: FacilityId, shortNameJa: string, locale: Locale): string {
  return locale === 'ja' ? shortNameJa : FACILITY_SHORT_EN[facilityId];
}

const MONTH_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "{year}年{month}月" 形式の月見出しを、言語に応じて整形する。 */
export function formatMonthLabel(year: number, month: number, locale: Locale): string {
  return locale === 'ja' ? `${year}年${month}月` : `${MONTH_EN[month - 1]} ${year}`;
}
