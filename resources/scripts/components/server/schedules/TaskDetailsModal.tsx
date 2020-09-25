import React, { useEffect } from 'react';
import Modal from '@/components/elements/Modal';
import { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { ServerContext } from '@/state/server';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { number, object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import { Textarea } from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Select from '@/components/elements/Select';

interface Props {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
    onDismissed: () => void;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
}

const TaskDetailsForm = ({ isEditingTask }: { isEditingTask: boolean }) => {
    const { values: { action }, initialValues, setFieldValue, setFieldTouched, isSubmitting } = useFormikContext<Values>();
    const backupLimit = ServerContext.useStoreState(state => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (action !== initialValues.action) {
            setFieldValue('payload', action === 'power' ? 'start' : '');
            setFieldTouched('payload', false);
        } else {
            setFieldValue('payload', initialValues.payload);
            setFieldTouched('payload', false);
        }
    }, [ action ]);

    return (
        <Form css={tw`m-0`}>
            <h2 css={tw`text-2xl mb-6`}>{isEditingTask ? 'Edit Task' : 'Create Task'}</h2>
            <div css={tw`flex`}>
                <div css={tw`mr-2 w-1/3`}>
                    <Label>Action</Label>
                    <FormikFieldWrapper name={'action'}>
                        <FormikField as={Select} name={'action'}>
                            <option value={'command'}>Send command</option>
                            {backupLimit !== 0 &&
                            <option value={'power'}>Send power action</option>
                            }
                            <option value={'backup'}>Create backup</option>
                        </FormikField>
                    </FormikFieldWrapper>
                </div>
                <div css={tw`flex-1 ml-6`}>
                    <Field
                        name={'timeOffset'}
                        label={'Time offset (in seconds)'}
                        description={'The amount of time to wait after the previous task executes before running this one. If this is the first task on a schedule this will not be applied.'}
                    />
                </div>
            </div>
            <div css={tw`mt-6`}>
                {action === 'command' ?
                    <div>
                        <Label>Payload</Label>
                        <FormikFieldWrapper name={'payload'}>
                            <FormikField as={Textarea} name={'payload'} rows={6} />
                        </FormikFieldWrapper>
                    </div>
                    :
                    action === 'power' ?
                        <div>
                            <Label>Payload</Label>
                            <FormikFieldWrapper name={'payload'}>
                                <FormikField as={Select} name={'payload'}>
                                    <option value={'start'}>Start the server</option>
                                    <option value={'restart'}>Restart the server</option>
                                    <option value={'stop'}>Stop the server</option>
                                    <option value={'kill'}>Terminate the server</option>
                                </FormikField>
                            </FormikFieldWrapper>
                        </div>
                        :
                        <div>
                            <Label>Ignored Files</Label>
                            <FormikFieldWrapper
                                name={'payload'}
                                description={'Optional. Include the files and folders to be excluded in this backup. By default, the contents of your .pteroignore file will be used.'}
                            >
                                <FormikField as={Textarea} name={'payload'} rows={6} />
                            </FormikFieldWrapper>
                        </div>
                }
            </div>
            <div css={tw`flex justify-end mt-6`}>
                <Button type={'submit'} disabled={isSubmitting}>
                    {isEditingTask ? 'Save Changes' : 'Create Task'}
                </Button>
            </div>
        </Form>
    );
};

export default ({ task, schedule, onDismissed }: Props) => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const appendSchedule = ServerContext.useStoreActions(actions => actions.schedules.appendSchedule);

    useEffect(() => {
        clearFlashes('schedule:task');
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
            .then(task => {
                let tasks = schedule.tasks.map(t => t.id === task.id ? task : t);
                if (!schedule.tasks.find(t => t.id === task.id)) {
                    tasks = [ ...tasks, task ];
                }

                appendSchedule({ ...schedule, tasks });
                onDismissed();
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false);
                addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
            }}
            validationSchema={object().shape({
                action: string().required().oneOf([ 'command', 'power', 'backup' ]),
                payload: string().when('action', {
                    is: v => v !== 'backup',
                    then: string().required('A task payload must be provided.'),
                    otherwise: string(),
                }),
                timeOffset: number().typeError('The time offset must be a valid number between 0 and 900.')
                    .required('A time offset value must be provided.')
                    .min(0, 'The time offset must be at least 0 seconds.')
                    .max(900, 'The time offset must be less than 900 seconds.'),
            })}
        >
            {({ isSubmitting }) => (
                <Modal
                    visible
                    appear
                    onDismissed={() => onDismissed()}
                    showSpinnerOverlay={isSubmitting}
                >
                    <FlashMessageRender byKey={'schedule:task'} css={tw`mb-4`} />
                    <TaskDetailsForm isEditingTask={typeof task !== 'undefined'} />
                </Modal>
            )}
        </Formik>
    );
};
