import React, { useState } from "react";
import { useInterval } from "../../hooks/useInterval";
import axios from 'axios';

const INTERVAL = 30000  // interval in ms
const NOTIF_API = `https://api.preprod.ebsi.eu/notifications/v1/notifications`

interface INotifCount {
    notificationCount: number;
}

const Notifications: React.FC = () => {

    const [notificationCount, setNotif] = useState<INotifCount>();

    useInterval(async() => {
        console.log('Checking for notifications');
        postNotif();
    }, INTERVAL);

    async function postNotif() {
        const BearerStr: string = 'Bearer '+localStorage.getItem('token');
        await axios.get(NOTIF_API,{
            headers: {
                'authorization': BearerStr
            }
        }
        ).then(res => {
            console.log(res.data);
            if(res.data.count > 0)
            setNotif({
                notificationCount: res.data.count,
            });
        });
    }

    return (
        <div>
            {notificationCount}
        </div>
    );
}

export default Notifications;


// {
//     hasNewNotif: "true",
//     count: 3,
//     notifications: {
//         "notif1",
//         "notif2",
//         "notif3"
//     }
// }