
let DateFormat = {
    date: new Date(),
    YEAR: 0,
    get YEAR(){
        return new Date().getFullYear()
    },
    MONTH: 0,
    get MONTH(){
        return new Date().getMonth() + 1
    },
    WEEK: 0,
    get WEEK(){
        return new Date().getDay()
    },
    DATE: 0,
    get DAY(){
        return new Date().getDate()
    },
    HOUER: 0,
    get HOUER(){
        return new Date().getHours()
    },
    MINUTE: 0,
    get MINUTE(){
        return new Date().getMinutes()
    },
    SECOND: 0,
    get SECOND(){
        return new Date().getSeconds()
    },
    SECONDS: 0,
    get SECONDS(){
        return Math.floor(Date.now() / 1000)
    },
    MILLISECOND: 0,
    get MILLISECOND(){
        return new Date().getMilliseconds()
    },
    MILLISECONDS: 0,
    get MILLISECONDS(){
        return Date.now()
    },
    format(reg, dateObj){
        let str = reg
        str = str.replace(/yyyy|YYYY/, dateObj.getFullYear())

        let month = dateObj.getMonth() + 1
        str = str.replace(/MM/, month < 10 ? '0' + month : month)
        str = str.replace(/M/, month)

        let date = dateObj.getDate()
        str = str.replace(/dd|DD/, date < 10 ? '0' + date : date)
        str = str.replace(/d|D/, date)

        let hour = dateObj.getHours()
        str = str.replace(/hh|HH/, hour < 10 ? '0' + hour : hour)
        str = str.replace(/h|H/, hour)

        let week = dateObj.getDay()
        str = str.replace(/hh|HH/, hour < 10 ? '0' + hour : hour)
        str = str.replace(/h|H/, hour)

        let minute = dateObj.getMinutes()
        str = str.replace(/mm/, minute < 10 ? '0' + minute : minute)
        str = str.replace(/m/, minute)

        let second = dateObj.getSeconds()
        str = str.replace(/ss|SS/, second < 10 ? '0' + second : second)
        str = str.replace(/s|S/, second)

        let milliSecond = dateObj.getMilliseconds()
        str = str.replace(/nnn|NNN/, milliSecond < 10 ? '00' + milliSecond : milliSecond < 100 ? '0' + milliSecond : milliSecond)
        str = str.replace(/n|N/, milliSecond)
        return str
    }
}
//yyyy/MM/dd hh/mm/ss/ms
// setInterval(()=>{
//     console.log(DateFormat.format('yyyy/M/d hh:mm:ss nnn', new Date()))
// })
console.log(DateFormat.SECONDS, DateFormat.MILLISECONDS)

console.log(DateFormat.format('hh:mm:ss nnn', new Date(1538901361498)))