import axios from 'axios'

const request = axios.create()

const alert = async (msg, title = '错误') => {
  await Swal.fire(title, msg, 'error')
  return false
}

request.interceptors.request.use(r => {
  NProgress.start()
  return r
})

request.interceptors.response.use(r => {
  NProgress.done()
  return r.data
}, e => {
  NProgress.done()
  alert(e.response?.data || '网络错误')
})

export default request
