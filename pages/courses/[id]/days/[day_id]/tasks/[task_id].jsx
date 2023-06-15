import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "./messages.module.scss";
import { sessionOptions } from "/lib/session";
import { withIronSessionSsr } from "iron-session/next";
import axios from "/utils/rest";
import { Dropzone } from "@mantine/dropzone";
import { showNotification } from "@mantine/notifications";
import Container from "react-bootstrap/Container";

import {
  Input,
  Text,
  Space,
  Card,
  Group,
  Button,
  useMantineTheme,
  Center,
} from "@mantine/core";
import { Upload, X, Check } from "tabler-icons-react";

export default function Task({ task, task_status, messages }) {
  const router = useRouter();
  const { task_id } = router.query;
  const [chat, setChat] = useState(messages);
  const [, setAcceptLoading] = useState(false);

  const [files, setFiles] = useState([]);

  const theme = useMantineTheme();

  const setAccepted = () => {
    setAcceptLoading(true);
    axios
      .post(`/public/tasks/${task_id}/accept`)
      .then(() => {
        router.replace(router.asPath);
      })
      .catch(() => { })
      .finally(() => { });
  };

  const getIconColor = (status, theme) => {
    return status.accepted
      ? theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 6]
      : status.rejected
        ? theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]
        : theme.colorScheme === "dark"
          ? theme.colors.dark[0]
          : theme.colors.gray[7];
  };

  const dropzoneChildren = (status, theme) => (
    <Group
      position="center"
      spacing="xl"
      style={{ minHeight: 55, pointerEvents: "none" }}
    >
      <Upload
        status={status}
        style={{ color: getIconColor(status, theme) }}
        size={55}
      />
      <div>
        <Text size="xl" inline>
          Загрузите файл с выполненным заданием
        </Text>
      </div>
    </Group>
  );

  const sendMessage = (e) => {
    e.preventDefault();
    const userMessage = e.target["user-message"].value;
    if (files.length == 0) return;
    const body = new FormData();
    body.append("message", userMessage);
    if (files) {
      body.append("files", files[0]);
    }
    axios
      .post(`/public/tasks/${task_id}/answer`, body)
      .then((res) => {
        e.target.reset();
        showNotification({
          title: "Сообщение отправлено",
          message:
            "Скоро эксперты проверят выполнение задания и дадут вам ответ",
          autoClose: 3500,
          color: "green",
          icon: <Check size={18} />,
        });
        setFiles([]);
        setChat([...chat, res.data]);
      })
      .catch(() => { })
      .finally(() => { });
  };
  return (
    <>
      <Head>
        <title>Школа талантов</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Space h="xl" />
        <Card p="lg">
          <div
            style={{ color: "#036459", fontSize: "24px", fontWeight: "600" }}
          >
            {task?.name}
          </div>
          {task_status !== "empty" ? (
            <>
              <Space h="lg" />
              <div
                style={{
                  color: "#036459",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Скачайте материалы для работы и изучите их
              </div>
              <Text
                variant="link"
                component="a"
                href={`/${task?.files?.at(0)}`}
              >
                Скачать файл {task?.name}
              </Text>

              {chat.length > 0 && (
                <div className={styles.messages}>
                  {chat
                    .sort((prev, next) => Number(prev.id) - Number(next.id))
                    .map((message) => {
                      return (
                        <div
                          className={`${styles.message} ${message?.answer_id
                              ? styles.interlocutor
                              : styles.you
                            }`}
                          key={message?.id}
                        >
                          {message?.files?.at(0) ? (
                            <>
                              {message?.message}
                              <Text
                                key={message?.id}
                                variant="link"
                                component="a"
                                size="sm"
                                download
                                href={`/${message?.files?.at(0)}`}
                              >
                                Скачать файл
                              </Text>
                              <Space h="sm" />
                            </>
                          ) : (
                            <Text size="md" weight={500}>
                              {message?.message}
                            </Text>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
              {task_status !== "ready" && (
                <div>
                  <form onSubmit={sendMessage}>
                    <Space h="sm" />
                    {files?.length > 0 && (
                      <Text size="sm">
                        Прикрепленные файлы:{" "}
                        {files?.map((el) => {
                          return ` ${el?.name},`;
                        })}
                      </Text>
                    )}

                    <Input placeholder="Введите сообщение" name="user-message" />
                    <Dropzone
                      onDrop={(files) => {
                        setFiles(files);
                      }}
                      onReject={() => {
                        showNotification({
                          title: "Файл отклонен",
                          autoClose: 3500,
                          color: "red",
                          icon: <X size={18} />,
                        });
                      }}
                      maxSize={3 * 4024 ** 2}
                      padding="xs"
                    >
                      {(status) => dropzoneChildren(status, theme)}
                    </Dropzone>
                    <Button
                      disabled={files.length == 0}
                      fullWidth
                      className="mt-1"
                      type="submit"
                      id="send-message"
                    >
                      Отправить
                    </Button>
                  </form>
                </div>
              )}
              {task_status === "ready" && (
                <Center>
                  <Text color="green" size="xl" weight={700}>
                    Вы выполнили задание, можете приступать к выполнению
                    следующих
                  </Text>
                </Center>
              )}
            </>
          ) : (
            <button
              style={{
                fontSize: "16px",
                color: "white",
                fontWeight: "600",
                padding: "10px",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#1FBEAC",
              }}
              onClick={() => setAccepted(true)}
            >
              Приступить к выполнению
            </button>
          )}
        </Card>
      </Container>
    </>
  );
}

export const getServerSideProps = withIronSessionSsr(
  async function getServerSideProps({ req, query }) {
    if (!req.cookies["user-cookies"]) {
      return {
        redirect: {
          destination: "/auth",
          permanent: false,
        },
      };
    }
    const { task_id } = query;
    const response = await axios.get(`/public/tasks/${task_id}`, {
      headers: {
        Cookie: `user-cookies=${req.cookies["user-cookies"]};`,
      },
    });
    let course = {};
    let day = {};
    let task = [];
    let task_status = "empty";
    let messages = [];
    if (response.status === 200) {
      course = response.data.course;
      day = response.data.day;
      task = response.data.task;
      task_status = response.data.task_status;
      messages = response.data.messages;
    }
    return {
      props: {
        course: course,
        day: day,
        task: task,
        task_status: task_status,
        messages: messages,
        user: req.session.user,
      },
    };
  },
  sessionOptions
);