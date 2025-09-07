import { redirect } from 'next/navigation'

export default function Dashboard() {
  // 대시보드는 이제 홈페이지(/)에 있으므로 리다이렉트
  redirect('/')
}
