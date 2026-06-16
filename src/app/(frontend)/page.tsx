import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/utilities/getCurrentMember'

export default async function HomePage() {
    const member = await getCurrentMember()
    redirect(member ? '/chat' : '/login')
}
