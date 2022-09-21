import React from 'react'

import ListGroup from 'react-bootstrap/ListGroup';


export interface IState {
    credentials: {
      credentialSubject: {
        id: string;
        firstName: string;
        familyName: string;
        achieved: {
          id: string;
          title: string;
          wasDerivedFrom: {
            grade: number;
          }[]
        }[]
  
      }
    }[]
  }
interface IProps {
    credentials: IState["credentials"]
}
type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;




// const RenderedCredential: React.FC<Credential> = ( credential:Credential): JSX.Element[] => {
//     return Object.keys(credential).map((attr: string) => {
//         return (
//             <div>
//                 {attr} : <RenderedCredential credential={credential[attr] } />
//             </div>
//         )
//     })
// }



// export default RenderedCredential;