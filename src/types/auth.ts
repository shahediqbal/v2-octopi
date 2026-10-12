export interface LegacyUserInfo {
  token: string
  userName?: string
  menuToken?: string
  menuInPlainListToken?: string
}

export interface LegacyMenuItem {
  MenuId: number | string
  MenuName: string
  MenuURL?: string
  MenuIsVisible?: boolean
  ChildMenus?: LegacyMenuItem[]
}

export interface AppMenuItem {
  id: string
  label: string
  path?: string
  children?: AppMenuItem[]
}
