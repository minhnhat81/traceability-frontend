
import create from 'zustand'

type AnchorMsg = { source: 'fabric'|'polygon', type: 'anchor', payload: any }
type State = {
  events: AnchorMsg[]
  connect: ()=>void
}
export const useAnchorStream = create<State>((set,get)=>({
  events: [],
  connect: ()=>{
    const proto = location.protocol==='https:'?'wss':'ws'
    const ws = new WebSocket(`${proto}://${location.host.replace(/:\d+$/,'')}:8022/ws/anchors`)
    ws.onmessage = (ev)=>{
      try{
        const msg = JSON.parse(ev.data)
        set({ events: [...get().events, msg].slice(-500) })
      }catch{}
    }
  }
}))
