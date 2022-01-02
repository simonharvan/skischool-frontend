import {SettingsModule} from "@/store/modules/settings";

export const durationToPrice = (duration: number, persons: number): number => {
  let personName = ('person_' + persons).replaceAll('.', '_')
  let hoursName = ('hours_' + duration).replaceAll('.', '_')

  if (SettingsModule.priceList[personName][hoursName]) {
    return SettingsModule.priceList[personName][hoursName]
  }

  return Math.round(duration * SettingsModule.pricePerHour * 100) / 100
}
