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
  pricePerHour: 25,
  priceList: {
    person_1: {
      hours_1: 25,
      hours_1_5: 36,
      hours_2: 48,
      hours_3: 70,
      hours_4: 90,
      hours_5: 105,
      hours_6: 120
    },
    person_2: {
      hours_1: 45,
      hours_1_5: 55,
      hours_2: 60,
      hours_3: 80,
      hours_4: 100,
      hours_5: 118,
      hours_6: 132
    },
    person_3: {
      hours_1: 64,
      hours_1_5: 69,
      hours_2: 74,
      hours_3: 94,
      hours_4: 114,
      hours_5: 130,
      hours_6: 145
    }
  }
}

export default settings
