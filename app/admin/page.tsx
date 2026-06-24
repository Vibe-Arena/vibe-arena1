'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Tab = 'overview' | 'users' | 'matches' | 'flags'

export default function AdminPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)

  const [stats,setStats] = useState({
    totalUsers:0,
    totalMatches:0,
    activeMatches:0,
    totalFlags:0
  })

  const [users,setUsers] = useState<any[]>([])
  const [matches,setMatches] = useState<any[]>([])
  const [flags,setFlags] = useState<any[]>([])
  const [search,setSearch] = useState('')


  useEffect(()=>{

    async function init(){

      const {data:{user}} = await supabase.auth.getUser()

      if(!user){
        router.push('/login')
        return
      }

      if(user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL){
        router.push('/dashboard')
        return
      }

      setAuthorized(true)

      await loadAll()

      setLoading(false)

    }

    init()

  },[])



  async function loadAll(){

    const [
      usersCount,
      matchesCount,
      activeCount,
      flagsCount,
      usersData,
      matchesData,
      flagsData

    ] = await Promise.all([

      supabase.from('users')
      .select('*',{count:'exact',head:true}),

      supabase.from('matches')
      .select('*',{count:'exact',head:true}),

      supabase.from('matches')
      .select('*',{count:'exact',head:true})
      .eq('status','active'),


      supabase.from('flags')
      .select('*',{count:'exact',head:true})
      .eq('resolved',false),


      supabase.from('users')
      .select('*')
      .order('created_at',{ascending:false})
      .limit(100),


      supabase.from('matches')
      .select('*')
      .order('created_at',{ascending:false})
      .limit(100),


      supabase.from('flags')
      .select('*')
      .eq('resolved',false)

    ])


    setStats({
      totalUsers:usersCount.count || 0,
      totalMatches:matchesCount.count || 0,
      activeMatches:activeCount.count || 0,
      totalFlags:flagsCount.count || 0
    })


    setUsers(usersData.data || [])
    setMatches(matchesData.data || [])
    setFlags(flagsData.data || [])

  }



  async function suspendUser(id:string,state:boolean){

    await supabase
    .from('users')
    .update({
      is_suspended:!state
    })
    .eq('id',id)

    loadAll()

  }



  async function resolveFlag(id:string){

    await supabase
    .from('flags')
    .update({
      resolved:true
    })
    .eq('id',id)

    loadAll()

  }



  const filteredUsers = users.filter(u=>
    u.username?.toLowerCase()
    .includes(search.toLowerCase()) ||
    u.email?.toLowerCase()
    .includes(search.toLowerCase())
  )



  if(loading)
    return <div className="center">Loading dashboard...</div>


  if(!authorized)
    return null



return (

<div className="app">


<header>

<div className="brand">
⚡ Vibe Arena
<span>Admin</span>
</div>


<button onClick={()=>router.push('/dashboard')}>
Back
</button>

</header>



<div className="layout">


<aside>

{
[
['overview','📊 Overview'],
['users','👥 Users'],
['matches','⚔️ Matches'],
['flags',`🚩 Flags ${stats.totalFlags || ''}`]

].map(([id,label])=>(

<div

className={
tab===id?'active item':'item'
}

onClick={()=>setTab(id as Tab)}

key={id}

>

{label}

</div>

))

}

</aside>




<main>



{
tab==='overview' &&

<>

<h1>Dashboard</h1>


<div className="cards">


<Card
title="Users"
value={stats.totalUsers}
/>


<Card
title="Matches"
value={stats.totalMatches}
/>


<Card
title="Live Matches"
value={stats.activeMatches}
/>


<Card
title="Reports"
value={stats.totalFlags}
/>


</div>


<div className="panel">

<h2>System Status</h2>

<p>
Everything is running normally.
</p>


</div>


</>

}




{
tab==='users' &&

<>

<h1>Users</h1>


<input

placeholder="Search users..."

value={search}

onChange={e=>setSearch(e.target.value)}

/>


<Table>

{
filteredUsers.map(u=>(

<div className="row" key={u.id}>


<div>
<strong>
{u.username || 'Unknown'}
</strong>

<small>
{u.email}
</small>

</div>


<span>
{new Date(u.created_at)
.toLocaleDateString()}
</span>



<button

className={
u.is_suspended
?'green'
:'red'
}

onClick={()=>suspendUser(
u.id,
u.is_suspended
)}

>

{
u.is_suspended
?'Restore'
:'Suspend'
}

</button>



</div>


))

}

</Table>


</>

}





{
tab==='matches' &&

<>

<h1>Matches</h1>


<Table>

{
matches.map(m=>(

<div className="row" key={m.id}>


<span className="badge">
{m.status}
</span>


<p>
{m.prompt || 'No prompt'}
</p>


<small>
{new Date(m.created_at)
.toLocaleDateString()}
</small>


</div>

))

}

</Table>


</>

}





{
tab==='flags' &&

<>

<h1>Reports</h1>


<Table>


{
flags.map(f=>(

<div className="row" key={f.id}>


<strong>
{f.type}
</strong>


<p>
{f.description}
</p>


<button
onClick={()=>resolveFlag(f.id)}
>
Resolve
</button>


</div>

))

}


</Table>


</>

}



</main>

</div>

</div>

)

}



function Card({title,value}:any){

return (

<div className="card">

<p>{title}</p>

<h2>{value}</h2>

</div>

)

}


function Table({children}:any){

return <div className="table">{children}</div>

}