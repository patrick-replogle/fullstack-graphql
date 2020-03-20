import React, { useState } from "react";
import gql from "graphql-tag";
import PetsList from "../components/PetsList";
import NewPet from "../components/NewPet";
import { useQuery, useMutation } from "@apollo/react-hooks";
import Loader from "../components/Loader";

// this is also optional, but a way to clean up graphql
// code that you will be reusing a lot
// const PETS_FIELDS = gql`
//   fragment PetsFields on Pet {
//     id
//     name
//     type
//     img
//     owner {
//       id
//       age @client
//     }
//   }
// `;

// how to use fragments in a query
// const ALL_PETS = gql`
//   query AllPets {
//     pets {
//       ${PETS_FIELDS}
//     }
//   }
// `;

const ALL_PETS = gql`
  query AllPets {
    pets {
      id
      name
      img
      owner {
        id
        age @client #mixing local state with server state
      }
    }
  }
`;

const NEW_PET = gql`
  mutation CreateAPet($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      id
      name
      type
      img
      owner {
        id
        age @client #mixing local state with server state
      }
    }
  }
`;

export default function Pets() {
  const [modal, setModal] = useState(false);
  // data loading and error are built in state that comes with useQuery
  const { data, loading, error } = useQuery(ALL_PETS);

  // newPet would contain the data, loading and error state within
  // useMutation can recieve a second object argument that can be used
  // to update the cache and rerender the state change within the component
  const [createPet, newPet] = useMutation(NEW_PET, {
    update(cache, { data: { addPet } }) {
      const data = cache.readQuery({ query: ALL_PETS });
      cache.writeQuery({
        query: ALL_PETS,
        data: { pets: [addPet, ...data.pets] }
      });
    }
  });

  const onSubmit = input => {
    setModal(false);
    createPet({
      variables: { newPet: input },
      // optimisticResponse is partly also set up in client.js and is optional
      // this is to avoid using loading screens and instead develop a seemless
      // loading similar to how facebook prefills loading components
      optimisticResponse: {
        __typename: "Mutation",
        addPet: {
          __typename: "Pet",
          id: Math.floor(Math.random() * 10000) + "",
          name: input.name,
          type: input.type,
          img: "https://via.placeholder.com/300"
        }
      }
    });
  };

  // loading and error state must by handled, otherwise data will be undefined when component mounts
  // otherwise adding if(loading || newPet.loading) can also be used for loading after a mutation
  if (loading) {
    return <Loader />;
  }

  if (error || newPet.error) {
    console.log(error);
    return <p>error!</p>;
  }

  console.log(data.pets);

  if (modal) {
    return (
      <div className="row center-xs">
        <div className="col-xs-8">
          <NewPet onSubmit={onSubmit} onCancel={() => setModal(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  );
}
