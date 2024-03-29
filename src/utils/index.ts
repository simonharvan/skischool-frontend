// Parse the time to string
export const parseTime = (
    time?: object | string | number,
    cFormat?: string
): string | null => {
    if (time === undefined) {
        return null
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date: Date
    if (typeof time === 'object') {
        date = time as Date
    } else {
        if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
            time = parseInt(time)
        }
        if (typeof time === 'number' && time.toString().length === 10) {
            time = time * 1000
        }
        date = new Date(time)
    }
    const formatObj: { [key: string]: number } = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    }
    const timeStr = format.replace(/{([ymdhisa])+}/g, (result, key) => {
        const value = formatObj[key]
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') {
            return ['日', '一', '二', '三', '四', '五', '六'][value]
        }
        return value.toString().padStart(2, '0')
    })
    return timeStr
}

// Format and filter json data using filterKeys array
export const formatJson = (filterKeys: any, jsonData: any) =>
    jsonData.map((data: any) => filterKeys.map((key: string) => {
        if (key === 'timestamp') {
            return parseTime(data[key])
        } else {
            return data[key]
        }
    }))

export const formatDateTimeToBackendWithOffset = (date: Date) => {
    date.setHours(date.getHours() - date.getTimezoneOffset() / 60)
    return formatDateTimeToBackend(date)
}

export const formatDateTimeToBackend = (date: Date) => {
    return date.toISOString()
        .replace('T', ' ')
        .replace('Z', '')
        .substr(0, 19)
}

export const formatDateToBackend = (date: Date) => {
    return date.toISOString().substr(0, 10)
}

export const formatTimeToBackend = (date: Date) => {
    return date.toTimeString().substring(0,5)
}

export const formatNiceDateTime = (date: Date) => {
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    return date.toLocaleDateString() + ' ' + date.getHours() + ':' +  minutes
}

export const formatNiceDate = (date: Date) => {
  return date.toLocaleDateString()
}

export const formatTimeInMinToNiceTime = (time: number) => {
  const hours = Math.floor(time / 60)

  let minutes: string | number = Math.floor(time % 60)
  minutes = minutes < 10 ? '0' + minutes : minutes

  return hours + ':' + minutes
}

export const generateId = (length: number, prefix: string = '') => {
    var result = prefix + '_'
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }

    return result
}



// Check if an element has a class
export const hasClass = (ele: HTMLElement, className: string) => {
    return !!ele.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

// Add class to element
export const addClass = (ele: HTMLElement, className: string) => {
    if (!hasClass(ele, className)) ele.className += ' ' + className
}

// Remove class from element
export const removeClass = (ele: HTMLElement, className: string) => {
    if (hasClass(ele, className)) {
        const reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        ele.className = ele.className.replace(reg, ' ')
    }
}

// Toggle class for the selected element
export const toggleClass = (ele: HTMLElement, className: string) => {
    if (!ele || !className) {
        return
    }
    let classString = ele.className
    const nameIndex = classString.indexOf(className)
    if (nameIndex === -1) {
        classString += '' + className
    } else {
        classString =
            classString.substr(0, nameIndex) +
            classString.substr(nameIndex + className.length)
    }
    ele.className = classString
}
