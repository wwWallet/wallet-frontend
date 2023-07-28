import React, {useState, useEffect} from 'react'
import toast, { Toaster } from 'react-hot-toast';
import {onMessageListener } from '../firebase';
import { AiOutlineClose } from 'react-icons/ai'; // Import close icon
import logo from '../assets/images/ediplomasLogo.svg';

const Notification = () => {
  const [notification, setNotification] = useState({title: '', body: ''});
  
	function ToastDisplay({ id }) {
		return (
			<div 
      className="flex justify-between items-center p-3 bg-white rounded-lg text-gray-600 max-w-3xl mx-auto cursor-pointer" 
			onClick={() => window.location.href = '/'}>
				<div className="flex items-center justify-start mr-6">
					<img src={logo} alt="Logo" className="h-15"/>
				</div>
				<div className="flex-grow text-center">
					<p className="font-bold text-lg">{notification?.title}</p>
					<p>{notification?.body}</p>
				</div>

				<button onClick={(e) => { 
									toast.dismiss(id); 
									e.stopPropagation(); // Prevents the redirection when close button is clicked
								}} 
								className="focus:outline-none ml-6">
					<AiOutlineClose size={24} />
				</button>
			</div>
		);
	};
	

  const notify = () =>  toast((t) => <ToastDisplay id={t.id} />, {
    onClick: () => {
        window.location.href = "/"; // or history.push("/") if using react-router
    }
  });

  useEffect(() => {
    if (notification?.title ){
     notify()
    }
  }, [notification])

  onMessageListener()
    .then((payload) => {
      setNotification({title: payload?.notification?.title, body: payload?.notification?.body});     
    })
    .catch((err) => console.log('failed: ', err));

  return (
     <Toaster/>
  )
}

export default Notification;
