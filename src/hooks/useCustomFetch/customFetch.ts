type Instance = {
  id: string;
  token: string;
};

export default function customFetch(
  method: string,
  instance: Instance,
  options: object,
  id?: number,
) {
  const notificationId = id ? `/${id}` : '';

  return new Promise((resolve, reject) => {
    fetch(
      process.env.REACT_APP_API_URL +
        instance.id +
        '/' +
        method +
        '/' +
        instance.token +
        notificationId,
      {
        ...options,
      },
    )
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          reject(response.statusText);
        }
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      })
  });
}
