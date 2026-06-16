import { getRequestConfig } from 'next-intl/server'
import messages from '../../messages/tr.json'

export default getRequestConfig(async () => {
    return { locale: 'tr', messages }
})
