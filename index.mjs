import { server } from './server'
import { workers } from './workers'

export const app = {};

app.init = () => {
    server.init();
    workers.init()
}

app.init()