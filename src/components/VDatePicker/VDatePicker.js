// Components
import VBtn from '../VBtn'
import VCard from '../VCard'
import VIcon from '../VIcon'
import VDatePickerTitle from './VDatePickerTitle'
import VDatePickerHeader from './VDatePickerHeader'
import VDatePickerDateTable from './VDatePickerDateTable'
import VDatePickerMonthTable from './VDatePickerMonthTable'
import VDatePickerYears from './VDatePickerYears'

// Mixins
import Picker from '../../mixins/picker'

// Utils
import { pad, createNativeLocaleFormatter } from './util'
import isDateAllowed from './util/isDateAllowed'

export default {
  name: 'v-date-picker',

  components: {
    VBtn,
    VCard,
    VIcon,
    VDatePickerTitle,
    VDatePickerHeader,
    VDatePickerDateTable,
    VDatePickerMonthTable,
    VDatePickerYears
  },

  mixins: [Picker],

  data () {
    const now = new Date()
    return {
      activePicker: this.type.toUpperCase(),
      defaultColor: 'accent',
      isReversing: false,
      now,
      // tableDate is a string in 'YYYY' / 'YYYY-M' format (leading zero for month is not required)
      tableDate: (() => {
        if (this.pickerDate) {
          return this.pickerDate
        }

        const date = this.value || `${now.getFullYear()}-${now.getMonth() + 1}`
        const type = this.type === 'date' ? 'month' : 'year'
        return this.sanitizeDateString(date, type)
      })()
    }
  },

  props: {
    allowedDates: Function,
    appendIcon: {
      type: String,
      default: 'chevron_right'
    },
    // Function formatting the day in date picker table
    dayFormat: {
      type: Function,
      default: null
    },
    events: {
      type: [Array, Object, Function],
      default: () => null
    },
    eventColor: {
      type: [String, Function, Object],
      default: 'warning'
    },
    firstDayOfWeek: {
      type: [String, Number],
      default: 0
    },
    // Function formatting the tableDate in the day/month table header
    headerDateFormat: {
      type: Function,
      default: null
    },
    locale: {
      type: String,
      default: 'en-us'
    },
    max: String,
    min: String,
    // Function formatting month in the months table
    monthFormat: {
      type: Function,
      default: null
    },
    pickerDate: String,
    prependIcon: {
      type: String,
      default: 'chevron_left'
    },
    readonly: Boolean,
    scrollable: Boolean,
    showCurrent: {
      type: [Boolean, String],
      default: true
    },
    // Function formatting currently selected date in the picker title
    titleDateFormat: {
      type: Function,
      default: null
    },
    type: {
      type: String,
      default: 'date',
      validator: type => ['date', 'month'].includes(type) // TODO: year
    },
    value: String,
    // Function formatting the year in table header and pickup title
    yearFormat: {
      type: Function,
      default: null
    },
    yearIcon: String
  },

  computed: {
    current () {
      if (this.showCurrent === true) {
        return this.sanitizeDateString(`${this.now.getFullYear()}-${this.now.getMonth() + 1}-${this.now.getDate()}`, this.type)
      }

      return this.showCurrent || null
    },
    firstAllowedDate () {
      const year = this.now.getFullYear()
      const month = this.now.getMonth()

      if (this.allowedDates) {
        for (let date = 1; date <= 31; date++) {
          const dateString = `${year}-${month + 1}-${date}`
          if (isNaN(new Date(dateString).getDate())) break

          const sanitizedDateString = this.sanitizeDateString(dateString, 'date')
          if (this.isDateAllowed(sanitizedDateString)) {
            return sanitizedDateString
          }
        }
      }

      return this.sanitizeDateString(`${year}-${month + 1}-${this.now.getDate()}`, 'date')
    },
    firstAllowedMonth () {
      const year = this.now.getFullYear()

      if (this.allowedDates) {
        for (let month = 0; month < 12; month++) {
          const dateString = `${year}-${pad(month + 1)}`
          if (this.isDateAllowed(dateString)) {
            return dateString
          }
        }
      }

      return `${year}-${pad(this.now.getMonth() + 1)}`
    },
    // inputDate MUST be a string in ISO 8601 format (including leading zero for month/day)
    // YYYY-MM for month picker
    // YYYY-MM-DD for date picker
    inputDate: {
      get () {
        if (this.value) {
          return this.sanitizeDateString(this.value, this.type)
        }

        return this.type === 'month' ? this.firstAllowedMonth : this.firstAllowedDate
      },
      set (value) {
        const date = value ? this.sanitizeDateString(value, this.type) : null
        this.$emit('input', date)
      }
    },
    day () {
      return this.inputDate.split('-')[2] * 1
    },
    month () {
      return this.inputDate.split('-')[1] - 1
    },
    year () {
      return this.inputDate.split('-')[0] * 1
    },
    tableMonth () {
      return (this.pickerDate || this.tableDate).split('-')[1] - 1
    },
    tableYear () {
      return (this.pickerDate || this.tableDate).split('-')[0] * 1
    },
    minMonth () {
      return this.min ? this.sanitizeDateString(this.min, 'month') : null
    },
    maxMonth () {
      return this.max ? this.sanitizeDateString(this.max, 'month') : null
    },
    minYear () {
      return this.min ? this.sanitizeDateString(this.min, 'year') : null
    },
    maxYear () {
      return this.max ? this.sanitizeDateString(this.max, 'year') : null
    },
    formatters () {
      return {
        year: this.yearFormat || createNativeLocaleFormatter(this.locale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 }),
        titleDate: this.titleDateFormat || this.defaultTitleDateFormatter
      }
    },
    defaultTitleDateFormatter () {
      const titleFormats = {
        year: { year: 'numeric', timeZone: 'UTC' },
        month: { month: 'long', timeZone: 'UTC' },
        date: { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }
      }

      const titleDateFormatter = createNativeLocaleFormatter(this.locale, titleFormats[this.type], {
        start: 0,
        length: { date: 10, month: 7, year: 4 }[this.type]
      })

      const landscapeFormatter = date => titleDateFormatter(date)
        .replace(/([^\d\s])([\d])/g, (match, nonDigit, digit) => `${nonDigit} ${digit}`)
        .replace(', ', ',<br>')

      return this.landscape ? landscapeFormatter : titleDateFormatter
    }
  },

  watch: {
    tableDate (val, prev) {
      // Make a ISO 8601 strings from val and prev for comparision, otherwise it will incorrectly
      // compare for example '2000-9' and '2000-10'
      const sanitizeType = this.type === 'month' ? 'year' : 'month'
      this.isReversing = this.sanitizeDateString(val, sanitizeType) < this.sanitizeDateString(prev, sanitizeType)
      this.$emit('update:pickerDate', val)
    },
    pickerDate (val) {
      if (val) {
        this.tableDate = val
      } else if (this.value && this.type === 'date') {
        this.tableDate = this.sanitizeDateString(val, 'month')
      } else if (this.value && this.type === 'month') {
        this.tableDate = this.sanitizeDateString(val, 'year')
      }
    },
    value () {
      if (this.value && !this.pickerDate) {
        this.tableDate = this.type === 'month' ? `${this.year}` : `${this.year}-${pad(this.month + 1)}`
      }
    },
    type (type) {
      this.activePicker = type.toUpperCase()

      if (this.value) {
        const date = this.sanitizeDateString(this.value, type)
        this.$emit('input', this.isDateAllowed(date) ? date : null)
      }
    }
  },

  methods: {
    isDateAllowed (value) {
      return isDateAllowed(value, this.min, this.max, this.allowedDates)
    },
    yearClick (value) {
      if (this.type === 'month') {
        const date = `${value}-${pad(this.month + 1)}`
        if (this.isDateAllowed(date)) this.inputDate = date
        this.tableDate = `${value}`
      } else {
        const date = `${value}-${pad(this.tableMonth + 1)}-${pad(this.day)}`
        if (this.isDateAllowed(date)) this.inputDate = date
        this.tableDate = `${value}-${pad(this.tableMonth + 1)}`
      }
      this.activePicker = 'MONTH'
    },
    monthClick (value) {
      // Updates inputDate setting 'YYYY-MM' or 'YYYY-MM-DD' format, depending on the picker type
      if (this.type === 'date') {
        const date = `${value}-${pad(this.day)}`
        if (this.isDateAllowed(date)) this.inputDate = date
        this.tableDate = value
        this.activePicker = 'DATE'
      } else {
        this.inputDate = value
        this.$emit('change', value)
      }
    },
    dateClick (value) {
      this.inputDate = value
      this.$emit('change', value)
    },
    genPickerTitle () {
      return this.$createElement('v-date-picker-title', {
        props: {
          date: this.formatters.titleDate(this.inputDate),
          selectingYear: this.activePicker === 'YEAR',
          year: this.formatters.year(`${this.year}`),
          yearIcon: this.yearIcon
        },
        slot: 'title',
        style: this.readonly ? {
          'pointer-events': 'none'
        } : undefined,
        on: {
          'update:selectingYear': value => this.activePicker = value ? 'YEAR' : this.type.toUpperCase()
        }
      })
    },
    genTableHeader () {
      return this.$createElement('v-date-picker-header', {
        props: {
          appendIcon: this.appendIcon,
          color: this.color,
          disabled: this.readonly,
          format: this.headerDateFormat,
          locale: this.locale,
          min: this.activePicker === 'DATE' ? this.minMonth : this.minYear,
          max: this.activePicker === 'DATE' ? this.maxMonth : this.maxYear,
          prependIcon: this.prependIcon,
          value: this.activePicker === 'DATE' ? `${this.tableYear}-${pad(this.tableMonth + 1)}` : `${this.tableYear}`
        },
        on: {
          toggle: () => this.activePicker = (this.activePicker === 'DATE' ? 'MONTH' : 'YEAR'),
          input: value => this.tableDate = value
        }
      })
    },
    genDateTable () {
      return this.$createElement('v-date-picker-date-table', {
        props: {
          allowedDates: this.allowedDates,
          color: this.color,
          current: this.current,
          disabled: this.readonly,
          events: this.events,
          eventColor: this.eventColor,
          firstDayOfWeek: this.firstDayOfWeek,
          format: this.dayFormat,
          locale: this.locale,
          min: this.min,
          max: this.max,
          tableDate: `${this.tableYear}-${pad(this.tableMonth + 1)}`,
          scrollable: this.scrollable,
          value: this.value
        },
        ref: 'table',
        on: {
          input: this.dateClick,
          tableDate: value => this.tableDate = value
        }
      })
    },
    genMonthTable () {
      return this.$createElement('v-date-picker-month-table', {
        props: {
          allowedDates: this.type === 'month' ? this.allowedDates : null,
          color: this.color,
          current: this.current ? this.sanitizeDateString(this.current, 'month') : null,
          disabled: this.readonly,
          format: this.monthFormat,
          locale: this.locale,
          min: this.minMonth,
          max: this.maxMonth,
          scrollable: this.scrollable,
          value: (!this.value || this.type === 'month') ? this.value : this.value.substr(0, 7),
          tableDate: `${this.tableYear}`
        },
        ref: 'table',
        on: {
          input: this.monthClick,
          tableDate: value => this.tableDate = value
        }
      })
    },
    genYears () {
      return this.$createElement('v-date-picker-years', {
        props: {
          color: this.color,
          format: this.yearFormat,
          locale: this.locale,
          min: this.minYear,
          max: this.maxYear,
          value: `${this.tableYear}`
        },
        on: {
          input: this.yearClick
        }
      })
    },
    genPickerBody () {
      const children = this.activePicker === 'YEAR' ? [
        this.genYears()
      ] : [
        this.genTableHeader(),
        this.activePicker === 'DATE' ? this.genDateTable() : this.genMonthTable()
      ]

      return this.$createElement('div', {
        key: this.activePicker,
        style: this.readonly ? {
          'pointer-events': 'none'
        } : undefined
      }, children)
    },
    // Adds leading zero to month/day if necessary, returns 'YYYY' if type = 'year',
    // 'YYYY-MM' if 'month' and 'YYYY-MM-DD' if 'date'
    sanitizeDateString (dateString, type) {
      const [year, month = 1, date = 1] = dateString.split('-')
      return `${year}-${pad(month)}-${pad(date)}`.substr(0, { date: 10, month: 7, year: 4 }[type])
    }
  },

  mounted () {
    if (this.pickerDate !== this.tableDate) {
      this.$emit('update:pickerDate', this.tableDate)
    }
  },

  render (h) {
    return this.genPicker('picker--date')
  }
}
