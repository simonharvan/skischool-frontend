interface ISettings {
  title: string // Overrides the default title
  showSettings: boolean // Controls settings panel display
  showTagsView: boolean // Controls tagsview display
  showSidebarLogo: boolean // Controls siderbar logo display
  fixedHeader: boolean // If true, will fix the header component
  errorLog: string[] // The env to enable the errorlog component, default 'production' only
  sidebarTextTheme: boolean // If true, will change active text color for sidebar based on theme
  devServerPort: number // Port number for webpack-dev-server
  mockServerPort: number // Port number for mock server
  pricePerHour: number
  priceList: any
}

// You can customize below settings :)
const settings: ISettings = {
  title: 'Ski school',
  showSettings: false,
  showTagsView: true,
  fixedHeader: false,
  showSidebarLogo: true,
  errorLog: ['production'],
  sidebarTextTheme: true,
  devServerPort: 9527,
  mockServerPort: 9528,
  pricePerHour: 30,
  priceList: {
    person_1: {
      hours_1: 30,
      hours_1_5: 43,
      hours_2: 56,
      hours_3: 81,
      hours_4: 108,
      hours_5: 135,
      hours_6: 156,
      hours_7: 182,
    },
    person_2: {
      hours_1: 45,
      hours_1_5: 58,
      hours_2: 71,
      hours_3: 96,
      hours_4: 123,
      hours_5: 150,
      hours_6: 171,
      hours_7: 197,
    },
    person_3: {
      hours_1: 55,
      hours_1_5: 68,
      hours_2: 81,
      hours_3: 106,
      hours_4: 133,
      hours_5: 160,
      hours_6: 181,
      hours_7: 207,
    }
  }
}

export default settings
